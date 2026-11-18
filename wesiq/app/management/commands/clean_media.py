# Management Command For Deleting Media Files That No Database Row References
# Dry Run By Default: Nothing Is Moved Or Deleted Unless --execute Is Passed
#
# Usage (From The Repo Root):
#   docker compose exec web python manage.py clean_media                # Dry Run: Summary Of What Would Happen
#   docker compose exec web python manage.py clean_media --list         # Dry Run: Also Lists Every File
#   docker compose exec web python manage.py clean_media --execute      # Moves Misplaced Profile Pictures And Deletes Orphans

import time
from collections import defaultdict
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from app.models import ChatAttachment, ChatSettings, PostMedia, Users

class Command(BaseCommand):
    help = "Deletes files in MEDIA_ROOT that no database row references (dry run unless --execute is passed)."

    def add_arguments(self, parser):
        parser.add_argument("--execute", action = "store_true", help = "Actually move and delete files. Without it, nothing is changed.")
        parser.add_argument("--list", action = "store_true", help = "Print every file that would be deleted, not only the summary.")
        parser.add_argument(
            "--min-age-hours", type = float, default = 24,
            help = "Never delete files modified more recently than this (protects uploads that are still being processed). Default: 24.",
        )
        parser.add_argument("--no-fix-avatars", action = "store_true", help = "Do not move profile pictures found in another user's folder.")

    def handle(self, *args, **options):
        execute = options["execute"]
        min_age_seconds = options["min_age_hours"] * 3600

        media_root = Path(settings.MEDIA_ROOT).resolve()

        if not media_root.is_dir():
            raise CommandError(f"MEDIA_ROOT does not exist: {media_root}")

        self.stdout.write(self.style.WARNING("EXECUTE MODE: files will be moved and deleted.") if execute else self.style.NOTICE("DRY RUN: nothing will be changed. Pass --execute to apply."))
        self.stdout.write(f"MEDIA_ROOT: {media_root}\n")

        # 1. Profile Pictures In The Wrong Folder (e.g. After User IDs Changed)
        avatar_moves = [] if options["no_fix_avatars"] else self.findMisplacedAvatars(media_root)

        for source, target in avatar_moves:
            self.stdout.write(f"MOVE  {source.relative_to(media_root)}  ->  {target.relative_to(media_root)}")

            if execute:
                target.parent.mkdir(parents = True, exist_ok = True)
                source.rename(target)

        # 2. Every File And Directory The Database Still Needs
        kept_files, kept_dirs, missing = self.collectReferences(media_root)

        # In A Dry Run The Moves Have Not Happened: Keep Their Sources And Do Not Report Their Targets As Missing
        if not execute:
            kept_files.update(source for source, _ in avatar_moves)
            planned_targets = {target.resolve() for _, target in avatar_moves}
            missing = [(label, path) for label, path in missing if (media_root / path).resolve() not in planned_targets]

        # 3. Orphans: Regular Files Under MEDIA_ROOT That Nothing References
        orphans = []
        too_new = 0
        now = time.time()

        for path in media_root.rglob("*"):
            if path.is_symlink() or not path.is_file():
                continue

            resolved = path.resolve()

            if not resolved.is_relative_to(media_root):
                continue

            if resolved in kept_files or any(resolved.is_relative_to(directory) for directory in kept_dirs):
                continue

            if now - resolved.stat().st_mtime < min_age_seconds:
                too_new += 1
                continue

            orphans.append(resolved)

        orphans.sort()

        # 4. Report
        by_folder = defaultdict(lambda: [0, 0])

        for path in orphans:
            folder = path.relative_to(media_root).parts[0]
            by_folder[folder][0] += 1
            by_folder[folder][1] += path.stat().st_size

        if options["list"]:
            for path in orphans:
                self.stdout.write(f"DELETE  {path.relative_to(media_root)}")

        self.stdout.write("\nKept (referenced): %d files, %d HLS directories" % (len(kept_files), len(kept_dirs)))

        for path in sorted(kept_files):
            self.stdout.write(f"  KEEP  {path.relative_to(media_root)}")

        for directory in sorted(kept_dirs):
            self.stdout.write(f"  KEEP  {directory.relative_to(media_root)}/")

        if missing:
            self.stdout.write(self.style.WARNING(f"\nStill missing after the avatar fix ({len(missing)}):"))

            for label, path in missing:
                self.stdout.write(f"  {label}: {path}")

        self.stdout.write("\nOrphans by folder:")

        for folder, (count, size) in sorted(by_folder.items()):
            self.stdout.write(f"  {folder + '/':<20} {count:>6} files  {self.humanSize(size):>10}")

        total_size = sum(size for _, size in by_folder.values())
        self.stdout.write(f"  {'TOTAL':<20} {len(orphans):>6} files  {self.humanSize(total_size):>10}")

        if too_new:
            self.stdout.write(f"\nSkipped {too_new} unreferenced files newer than {options['min_age_hours']} h.")

        if not execute:
            self.stdout.write(self.style.NOTICE("\nDry run finished. Nothing was changed."))
            return

        # 5. Delete
        for path in orphans:
            path.unlink()

        removed_dirs = self.removeEmptyDirs(media_root)
        self.stdout.write(self.style.SUCCESS(f"\nDeleted {len(orphans)} files ({self.humanSize(total_size)}) and {removed_dirs} empty directories."))

    # Function For Find Profile Pictures That Exist Only In Another User's Folder
    def findMisplacedAvatars(self, media_root):
        moves = []
        images_root = media_root / "images"

        for user_id, name in Users.objects.exclude(profile_picture_name__isnull = True).exclude(profile_picture_name = "").values_list("id", "profile_picture_name"):
            target = images_root / str(user_id) / name

            if target.is_file():
                continue

            candidates = [path for path in images_root.glob(f"*/{name}") if path.is_file() and not path.is_symlink()]

            # The Names Are Random Tokens, So Only An Unambiguous Single Match Is Moved
            if len(candidates) == 1:
                moves.append((candidates[0].resolve(), target))

            elif len(candidates) > 1:
                self.stdout.write(self.style.WARNING(f"User {user_id}: {name} found in {len(candidates)} folders, not moving it."))

        return moves

    # Function For Collect Every Media Path Referenced By The Database
    def collectReferences(self, media_root):
        kept_files = set()
        kept_dirs = set()
        missing = []

        def keep(label, relative_path):
            if not relative_path:
                return

            path = (media_root / relative_path).resolve()

            if not path.is_relative_to(media_root):
                return

            # An HLS Playlist Needs Its Whole Folder (Variant Playlists And Segments)
            if path.name.endswith(".m3u8"):
                kept_dirs.add(path.parent)

            kept_files.add(path)

            if not path.is_file():
                missing.append((label, relative_path))

        for user_id, name in Users.objects.exclude(profile_picture_name__isnull = True).exclude(profile_picture_name = "").values_list("id", "profile_picture_name"):
            keep("Users.profile_picture_name", f"images/{user_id}/{name}")

        for row in PostMedia.objects.values_list("file", "thumbnail", "sprite_sheet", "vtt_file"):
            for field, value in zip(("file", "thumbnail", "sprite_sheet", "vtt_file"), row):
                keep(f"PostMedia.{field}", value)

        for row in ChatAttachment.objects.values_list("file", "thumbnail"):
            for field, value in zip(("file", "thumbnail"), row):
                keep(f"ChatAttachment.{field}", value)

        for value in ChatSettings.objects.values_list("background_image", flat = True):
            keep("ChatSettings.background_image", value)

        return kept_files, kept_dirs, missing

    # Function For Remove Directories Left Empty After Deleting (Never MEDIA_ROOT Or Its Top-Level Folders)
    def removeEmptyDirs(self, media_root):
        removed = 0

        for directory in sorted((path for path in media_root.rglob("*") if path.is_dir() and not path.is_symlink()), key = lambda path: len(path.parts), reverse = True):
            if directory.parent == media_root:
                continue

            if not any(directory.iterdir()):
                directory.rmdir()
                removed += 1

        return removed

    @staticmethod
    def humanSize(size):
        for unit in ("B", "KB", "MB", "GB"):
            if size < 1024:
                return f"{size:.1f} {unit}"

            size /= 1024

        return f"{size:.1f} TB"
