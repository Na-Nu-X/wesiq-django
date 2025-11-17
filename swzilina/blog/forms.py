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
        widget=forms.TextInput(attrs={"placeholder": "Zadajte 6-miestny overovací kód", "autocomplete": "off"}),
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

    phone_number = forms.CharField(
        widget=forms.TextInput(attrs={"placeholder": "Zadajte vaše telefónne číslo"}),
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
        widget=forms.PasswordInput(attrs={"class": "password_check", "placeholder": "Znovu zadajte heslo", "autocomplete": "off"}),
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
        widget=forms.TextInput(attrs={"placeholder": "Zmeniť meno"}),
        label=False,
        max_length=50,
        required=False,
        error_messages={
            "max_length": "Zadané meno je príliš dlhé",
        },
    )

    last_name = forms.CharField(
        widget=forms.TextInput(attrs={"placeholder": "Zmeniť priezvisko"}),
        label=False,
        max_length=50,
        required=False,
        error_messages={
            "max_length": "Zadané priezvisko je príliš dlhé",
        },
    )

    email_address = forms.EmailField(
        widget=forms.EmailInput(attrs={"placeholder": "Zmeniť e-mail"}),
        label=False,
        max_length=50,
        required=False,
        error_messages={
            "max_length": "Zadaný e-mail je príliš dlhý",
        },
    )

    phone_number = forms.CharField(
        widget=forms.TextInput(attrs={"placeholder": "Zmeniť telefónne číslo"}),
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