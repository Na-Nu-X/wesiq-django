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
            "1": "Otázka",
            "2": "Návrh na zlepšenie",
            "3": "Nahlásenie chyby",
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
class loginForm(forms.Form):
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

    password = forms.CharField(
        widget=forms.PasswordInput(attrs={"placeholder": "Vytvorte heslo"}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
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
        widget=forms.PasswordInput(attrs={"placeholder": "Vytvorte heslo"}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": "Zadané heslo je príliš dlhé",
            "required": "Vytvorte heslo",
        },
    )

    password_check = forms.CharField(
        widget=forms.PasswordInput(attrs={"placeholder": "Znovu zadajte heslo"}),
        label=False,
        max_length=50,
        required=True,
        error_messages={
            "max_length": "Zadané heslo je príliš dlhé",
            "required": "Znovu zadajte heslo",
        },
    )