from django import forms
from django.utils.translation import gettext_lazy as _

class contactForm(forms.Form):
    first_name = forms.CharField(
        widget=forms.TextInput(attrs={"placeholder": _("Zadajte vaše meno")}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": _("Zadané meno je príliš dlhé"),
            "required": _("Zadajte vaše meno"),
        },
    )

    last_name = forms.CharField(
        widget=forms.TextInput(attrs={"placeholder": _("Zadajte vaše priezvisko")}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": _("Zadané priezvisko je príliš dlhé"),
            "required": _("Zadajte vaše priezvisko"),
        },
    )

    email_address = forms.EmailField(
        widget=forms.EmailInput(attrs={"placeholder": _("Zadajte váš e-mail")}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": _("Zadaný e-mail je príliš dlhý"),
            "required": _("Zadajte váš e-mail"),
        },
    )

    subject = forms.ChoiceField(
        choices = {
            "Otázka": _("Otázka"),
            "Návrh na zlepšenie": _("Návrh na zlepšenie"),
            "Nahlásenie chyby": _("Nahlásenie chyby"),
        },
        label=False,
        required=False,
    )

    message = forms.CharField(
        widget=forms.Textarea(attrs={"placeholder": _("Napíšte správu")}),
        label=False,
        max_length=200,
        required=True,
        error_messages={
            "max_length": _("Vaša správa je príliš dlhá"),
            "required": _("Napíšte správu"),
        },
    )

    select_attachment = forms.FileField(
        widget=forms.ClearableFileInput(attrs={"id": "select_attachment", "accept": "image/*, video/*"}),
        label=False,
        required=False,
    )

class reviewForm(forms.Form):
    rating = forms.CharField(
        widget=forms.TextInput(attrs={"value": "0"}),
        label=False,
        max_length=1,
        required=False,
    )

    review = forms.CharField(
        widget=forms.Textarea(attrs={"class": "review_content", "placeholder": _("Zanechajte nám hodnotenie")}),
        label=False,
        max_length=200,
        required=False,
        error_messages={
            "max_length": _("Vaša recenzia je príliš dlhá"),
        },
    )

    delete_review = forms.BooleanField(
        widget=forms.CheckboxInput(attrs={"id": "delete_review"}),
        required=False,
    )
class loginForm(forms.Form):
    email_address = forms.EmailField(
        widget=forms.EmailInput(attrs={"class": "email_address", "placeholder": _("Zadajte váš e-mail")}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": _("Zadaný e-mail je príliš dlhý"),
            "required": _("Zadajte váš e-mail"),
        },
    )

    password = forms.CharField(
        widget=forms.TextInput(attrs={"class": "password", "placeholder": _("Zadajte vaše heslo"), "autocomplete": "off"}),
        label=False,
        required=True,
        error_messages={
            "required": _("Zadajte vaše heslo"),
        },
    )

class passwordResetForm(forms.Form):
    new_password = forms.CharField(
        widget=forms.TextInput(attrs={"class": "password", "placeholder": _("Vytvorte heslo"), "autocomplete": "off"}),
        label=False,
        min_length=8,
        max_length=50,
        required=True,
        error_messages={
            "min_length": _("Zadané heslo je príliš krátke"),
            "max_length": _("Zadané heslo je príliš dlhé"),
            "required": _("Vytvorte heslo"),
        },
    )

class registrationForm(forms.Form):
    first_name = forms.CharField(
        widget=forms.TextInput(attrs={"class": "first_name", "placeholder": _("Meno")}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": _("Zadané meno je príliš dlhé"),
            "required": _("Zadajte vaše meno"),
        },
    )

    last_name = forms.CharField(
        widget=forms.TextInput(attrs={"class": "last_name", "placeholder": _("Priezvisko")}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": _("Zadané priezvisko je príliš dlhé"),
            "required": _("Zadajte vaše priezvisko"),
        },
    )

    email_address = forms.EmailField(
        widget=forms.EmailInput(attrs={"class": "email_address", "placeholder": _("E-mail")}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": _("Zadaný e-mail je príliš dlhý"),
            "required": _("Zadajte váš e-mail"),
        },
    )

    phone_number = forms.CharField(
        widget=forms.TextInput(attrs={"class": "phone_number", "type": "tel", "placeholder": _("Telefónne číslo")}),
        label=False,
        max_length=25,
        required=False,
        error_messages={
            "max_length": _("Zadané telefónne číslo je príliš dlhé"),
        },
    )

    password = forms.CharField(
        widget=forms.TextInput(attrs={"class": "password", "placeholder": _("Vytvorte heslo"), "autocomplete": "off"}),
        label=False,
        min_length=8,
        max_length=50,
        required=True,
        error_messages={
            "min_length": _("Zadané heslo je príliš krátke"),
            "max_length": _("Zadané heslo je príliš dlhé"),
            "required": _("Vytvorte heslo"),
        },
    )

    password_check = forms.CharField(
        widget=forms.PasswordInput(attrs={"class": "password_check", "placeholder": _("Overte heslo"), "autocomplete": "off"}),
        label=False,
        min_length=8,
        max_length=50,
        required=True,
        error_messages={
            "min_length": _("Zadané heslo je príliš krátke"),
            "max_length": _("Zadané heslo je príliš dlhé"),
            "required": _("Znovu zadajte heslo"),
        },
    )

class editAccountForm(forms.Form):
    first_name = forms.CharField(
        widget=forms.TextInput(attrs={"class": "first_name", "placeholder": _("Zmeniť meno")}),
        label=False,
        max_length=50,
        required=False,
        error_messages={
            "max_length": _("Zadané meno je príliš dlhé"),
        },
    )

    last_name = forms.CharField(
        widget=forms.TextInput(attrs={"class": "last_name", "placeholder": _("Zmeniť priezvisko")}),
        label=False,
        max_length=50,
        required=False,
        error_messages={
            "max_length": _("Zadané priezvisko je príliš dlhé"),
        },
    )

    email_address = forms.EmailField(
        widget=forms.EmailInput(attrs={"class": "email_address", "placeholder": _("Zmeniť e-mail")}),
        label=False,
        max_length=50,
        required=False,
        error_messages={
            "max_length": _("Zadaný e-mail je príliš dlhý"),
        },
    )

    phone_number = forms.CharField(
        widget=forms.TextInput(attrs={"class": "phone_number", "type": "tel", "placeholder": _("Zmeniť telefónne číslo")}),
        label=False,
        max_length=20,
        required=False,
        error_messages={
            "max_length": _("Zadané telefónne číslo je príliš dlhé"),
        },
    )

    select_profile_picture = forms.FileField(
        widget=forms.ClearableFileInput(attrs={"id": "select_profile_picture", "accept": "image/*"}),
        label=False,
        required=False,
    )

    delete_profile_picture = forms.BooleanField(
        widget=forms.CheckboxInput(attrs={"id": "delete_profile_picture"}),
        required=False,
    )

    delete_account = forms.BooleanField(
        widget=forms.CheckboxInput(attrs={"id": "delete_account"}),
        required=False,
    )

class writeArticleForm(forms.Form):
    title = forms.CharField(
        widget=forms.TextInput(attrs={"placeholder": _("Názov")}),
        label=False,
        max_length=20,
        required=True,
        error_messages={
            "max_length": _("Zadaný názov je príliš dlhý"),
            "required": _("Zadajte názov"),
        },
    )

    content = forms.CharField(
        widget=forms.Textarea(attrs={"placeholder": _("Článok")}),
        label=False,
        required=True,
        error_messages={
            "required": _("Obsah článku nesmie byť prázdny"),
        },
    )

    category_style = forms.ChoiceField(
        widget=forms.Select(attrs={"class": "category_style"}),
        choices = {
            "": _("Kategória podľa určenia"),
            "static": _("Statické prvky"),
            "dynamic": _("Dynamický trik"),
            "isotonic": _("Izotonický cvik"),
            "balance": _("O rovnováhe"),
            "flexibility": _("O flexibilite")
        },
        label=False,
        required=True,
        error_messages={
            "required": _("Vyberte kategóriu podľa určenia"),
        },
    )

    category_movement = forms.ChoiceField(
        widget=forms.Select(attrs={"class": "category_movement"}),
        choices = {
            "": _("Kategória podľa pohybu"),
            "pull": _("Ťah"),
            "push": _("Tlak"),
            "legs": _("Nohy"),
        },
        label=False,
        required=True,
        error_messages={
            "required": _("Vyberte kategóriu podľa pohybu"),
        },
    )

    category_difficulty = forms.ChoiceField(
        widget=forms.Select(attrs={"class": "category_difficulty"}),
        choices = {
            "": _("Kategória podľa obtiažnosti"),
            "beginner": _("Pre začiatočníkov"),
            "intermediate": _("Pre stredne pokročilých"),
            "advanced": _("Pre pokročilých"),
            "elite": _("Pre profesionálov"),
        },
        label=False,
        required=True,
        error_messages={
            "required": _("Vyberte kategóriu podľa obtiažnosti"),
        },
    )

    link = forms.CharField(
        widget=forms.TextInput(attrs={"placeholder": _("Link")}),
        label=False,
        max_length=20,
        required=True,
        error_messages={
            "max_length": _("Zadaný link je príliš dlhý"),
            "required": _("Zadajte link"),
        },
    )

    select_article_image = forms.FileField(
        widget=forms.ClearableFileInput(attrs={"id": "select_article_image", "accept": "image/*"}),
        label=False,
        required=False,
    )

class blogSubscribeForm(forms.Form):
    email_address = forms.EmailField(
        widget=forms.EmailInput(attrs={"placeholder": _("Zadajte váš e-mail")}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": _("Zadaný e-mail je príliš dlhý"),
            "required": _("Zadajte váš e-mail"),
        },
    )

class writeCommentForm(forms.Form):
    comment = forms.CharField(
        widget=forms.TextInput(attrs={"placeholder": _("Napísať komentár"), "autocomplete": "off"}),
        label=False,
        max_length=200,
        required=True,
        error_messages={
            "max_length": _("Zadaný komentár je príliš dlhý"),
            "required": _("Zanechajte komentár"),
        },
    )