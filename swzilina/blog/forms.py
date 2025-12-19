from django import forms

class contactForm(forms.Form):
    first_name = forms.CharField(
        widget=forms.TextInput(attrs={"placeholder": "Zadajte vaše meno"}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": "Zadané meno je príliš dlhé",
            "required": "Zadajte vaše meno",
        },
    )

    last_name = forms.CharField(
        widget=forms.TextInput(attrs={"placeholder": "Zadajte vaše priezvisko"}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": "Zadané priezvisko je príliš dlhé",
            "required": "Zadajte vaše priezvisko",
        },
    )

    email_address = forms.EmailField(
        widget=forms.EmailInput(attrs={"placeholder": "Zadajte váš e-mail"}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": "Zadaný e-mail je príliš dlhý",
            "required": "Zadajte váš e-mail",
        },
    )

    subject = forms.ChoiceField(
        choices = {
            "Otázka": "Otázka",
            "Návrh na zlepšenie": "Návrh na zlepšenie",
            "Nahlásenie chyby": "Nahlásenie chyby",
        },
        label=False,
        required=False,
    )

    message = forms.CharField(
        widget=forms.Textarea(attrs={"placeholder": "Napíšte správu"}),
        label=False,
        max_length=200,
        required=True,
        error_messages={
            "max_length": "Vaša správa je príliš dlhá",
            "required": "Napíšte správu",
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
        widget=forms.Textarea(attrs={"placeholder": "Zanechajte nám hodnotenie"}),
        label=False,
        max_length=200,
        required=False,
        error_messages={
            "max_length": "Vaša recenzia je príliš dlhá",
        },
    )

    delete_review = forms.BooleanField(
        widget=forms.CheckboxInput(attrs={"id": "delete_review"}),
        required=False,
    )
class loginForm(forms.Form):
    email_address = forms.EmailField(
        widget=forms.EmailInput(attrs={"class": "email_address", "placeholder": "Zadajte váš e-mail"}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": "Zadaný e-mail je príliš dlhý",
            "required": "Zadajte váš e-mail",
        },
    )

    password = forms.CharField(
        widget=forms.TextInput(attrs={"class": "password", "placeholder": "Zadajte vaše heslo", "autocomplete": "off"}),
        label=False,
        required=True,
        error_messages={
            "required": "Zadajte vaše heslo",
        },
    )

class passwordResetForm(forms.Form):
    password_reset_code = forms.CharField(
        widget=forms.TextInput(attrs={"class": "password_reset_code", "placeholder": "Zadajte 6-miestny overovací kód", "autocomplete": "off"}),
        label=False,
        max_length=6,
        required=True,
        error_messages={
            "max_length": "Zadaný kód je príliš dlhý",
            "required": "Zadajte 6-miestny overovací kód",
        },
    )

    new_password = forms.CharField(
        widget=forms.TextInput(attrs={"class": "password", "placeholder": "Vytvorte heslo", "autocomplete": "off"}),
        label=False,
        min_length=8,
        max_length=50,
        required=True,
        error_messages={
            "min_length": "Zadané heslo je príliš krátke",
            "max_length": "Zadané heslo je príliš dlhé",
            "required": "Vytvorte heslo",
        },
    )

class registrationForm(forms.Form):
    first_name = forms.CharField(
        widget=forms.TextInput(attrs={"class": "first_name", "placeholder": "Meno"}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": "Zadané meno je príliš dlhé",
            "required": "Zadajte vaše meno",
        },
    )

    last_name = forms.CharField(
        widget=forms.TextInput(attrs={"class": "last_name", "placeholder": "Priezvisko"}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": "Zadané priezvisko je príliš dlhé",
            "required": "Zadajte vaše priezvisko",
        },
    )

    email_address = forms.EmailField(
        widget=forms.EmailInput(attrs={"class": "email_address", "placeholder": "E-mail"}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": "Zadaný e-mail je príliš dlhý",
            "required": "Zadajte váš e-mail",
        },
    )

    phone_number = forms.CharField(
        widget=forms.TextInput(attrs={"class": "phone_number", "type": "tel", "placeholder": "Telefónne číslo"}),
        label=False,
        max_length=20,
        required=False,
        error_messages={
            "max_length": "Zadané telefónne číslo je príliš dlhé",
        },
    )

    password = forms.CharField(
        widget=forms.TextInput(attrs={"class": "password", "placeholder": "Vytvorte heslo", "autocomplete": "off"}),
        label=False,
        min_length=8,
        max_length=50,
        required=True,
        error_messages={
            "min_length": "Zadané heslo je príliš krátke",
            "max_length": "Zadané heslo je príliš dlhé",
            "required": "Vytvorte heslo",
        },
    )

    password_check = forms.CharField(
        widget=forms.PasswordInput(attrs={"class": "password_check", "placeholder": "Overte heslo", "autocomplete": "off"}),
        label=False,
        min_length=8,
        max_length=50,
        required=True,
        error_messages={
            "min_length": "Zadané heslo je príliš krátke",
            "max_length": "Zadané heslo je príliš dlhé",
            "required": "Znovu zadajte heslo",
        },
    )

class editAccountForm(forms.Form):
    first_name = forms.CharField(
        widget=forms.TextInput(attrs={"class": "first_name", "placeholder": "Zmeniť meno"}),
        label=False,
        max_length=50,
        required=False,
        error_messages={
            "max_length": "Zadané meno je príliš dlhé",
        },
    )

    last_name = forms.CharField(
        widget=forms.TextInput(attrs={"class": "last_name", "placeholder": "Zmeniť priezvisko"}),
        label=False,
        max_length=50,
        required=False,
        error_messages={
            "max_length": "Zadané priezvisko je príliš dlhé",
        },
    )

    email_address = forms.EmailField(
        widget=forms.EmailInput(attrs={"class": "email_address", "placeholder": "Zmeniť e-mail"}),
        label=False,
        max_length=50,
        required=False,
        error_messages={
            "max_length": "Zadaný e-mail je príliš dlhý",
        },
    )

    phone_number = forms.CharField(
        widget=forms.TextInput(attrs={"class": "phone_number", "type": "tel", "placeholder": "Zmeniť telefónne číslo"}),
        label=False,
        max_length=20,
        required=False,
        error_messages={
            "max_length": "Zadané telefónne číslo je príliš dlhé",
        },
    )

    # current_password = forms.CharField(
    #     widget=forms.PasswordInput(attrs={"placeholder": "Zadajte vaše heslo"}),
    #     label=False,
    #     max_length=50,
    #     required=True,
    #     error_messages={
    #         "max_length": "Zadané heslo je príliš dlhé",
    #         "required": "Vytvorte heslo",
    #     },
    # )

    # new_password = forms.CharField(
    #     widget=forms.PasswordInput(attrs={"placeholder": "Vytvorte nové heslo"}),
    #     label=False,
    #     max_length=50,
    #     required=True,
    #     error_messages={
    #         "max_length": "Zadané heslo je príliš dlhé",
    #         "required": "Vytvorte heslo",
    #     },
    # )

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
        widget=forms.TextInput(attrs={"placeholder": "Názov"}),
        label=False,
        max_length=20,
        required=True,
        error_messages={
            "max_length": "Zadaný názov je príliš dlhý",
            "required": "Zadajte názov",
        },
    )

    content = forms.CharField(
        widget=forms.Textarea(attrs={"placeholder": "Článok"}),
        label=False,
        required=True,
        error_messages={
            "required": "Obsah článku nesmie byť prázdny",
        },
    )

    # categories = forms.CharField(
    #     widget=forms.TextInput(attrs={"placeholder": "Kategórie"}),
    #     label=False,
    #     max_length=30,
    #     required=True,
    #     error_messages={
    #         "max_length": "Zadajte menej kategórií",
    #         "required": "Zadajte kategórie",
    #     },
    # )

    category_style = forms.ChoiceField(
        widget=forms.Select(attrs={"class": "category_style"}),
        choices = {
            "": "Kategória podľa určenia",
            "static": "Statické prvky",
            "dynamic": "Dynamický trik",
            "isotonic": "Izotonický cvik",
            "balance": "O rovnováhe",
            "flexibility": "O flexibilite"
        },
        label=False,
        required=True,
        error_messages={
            "required": "Vyberte kategóriu podľa určenia",
        },
    )

    category_movement = forms.ChoiceField(
        widget=forms.Select(attrs={"class": "category_movement"}),
        choices = {
            "": "Kategória podľa pohybu",
            "pull": "Ťah",
            "push": "Tlak",
            "legs": "Nohy",
        },
        label=False,
        required=True,
        error_messages={
            "required": "Vyberte kategóriu podľa pohybu",
        },
    )

    category_difficulty = forms.ChoiceField(
        widget=forms.Select(attrs={"class": "category_difficulty"}),
        choices = {
            "": "Kategória podľa obtiažnosti",
            "beginner": "Pre začiatočníkov",
            "intermediate": "Pre stredne pokročilých",
            "advanced": "Pre pokročilých",
            "elite": "Pre profesionálov",
        },
        label=False,
        required=True,
        error_messages={
            "required": "Vyberte kategóriu podľa obtiažnosti",
        },
    )

    link = forms.CharField(
        widget=forms.TextInput(attrs={"placeholder": "Link"}),
        label=False,
        max_length=20,
        required=True,
        error_messages={
            "max_length": "Zadaný link je príliš dlhý",
            "required": "Zadajte link",
        },
    )

    select_article_image = forms.FileField(
        widget=forms.ClearableFileInput(attrs={"id": "select_article_image", "accept": "image/*"}),
        label=False,
        required=False,
    )

class blogSubscribeForm(forms.Form):
    email_address = forms.EmailField(
        widget=forms.EmailInput(attrs={"placeholder": "Zadajte váš e-mail"}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": "Zadaný e-mail je príliš dlhý",
            "required": "Zadajte váš e-mail",
        },
    )

class writeCommentForm(forms.Form):
    comment = forms.CharField(
        widget=forms.TextInput(attrs={"placeholder": "Napísať komentár", "autocomplete": "off"}),
        label=False,
        max_length=200,
        required=True,
        error_messages={
            "max_length": "Zadaný komentár je príliš dlhý",
            "required": "Zanechajte komentár",
        },
    )