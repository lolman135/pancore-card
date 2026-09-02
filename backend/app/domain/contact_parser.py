import re

from app.domain.contact import Contact, InvalidContactError

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$")
PHONE_RE = re.compile(r"^\+?\d{10,15}$")
# Правила Telegram: 5-32 символа, начинается с буквы, заканчивается буквой или цифрой.
TELEGRAM_NAME = r"[A-Za-z][A-Za-z0-9_]{3,30}[A-Za-z0-9]"
# Собачка обязательна: без неё ветка ловила бы любое латинское слово и заявка
# с именем вместо контакта уходила бы как telegram.
TELEGRAM_RE = re.compile(rf"^@{TELEGRAM_NAME}$")
TELEGRAM_LINK_RE = re.compile(
    rf"^(?:https?://)?(?:t\.me|telegram\.me)/(?P<name>{TELEGRAM_NAME})/?$"
)

PHONE_SEPARATORS_RE = re.compile(r"[\s()\-.]")


def parse_contact(raw: str) -> Contact:
    value = raw.strip()

    if EMAIL_RE.match(value):
        return Contact(kind="email", value=value.lower())

    digits = PHONE_SEPARATORS_RE.sub("", value)
    if PHONE_RE.match(digits):
        return Contact(kind="phone", value=digits if digits.startswith("+") else f"+{digits}")

    link = TELEGRAM_LINK_RE.match(value)
    if link:
        return Contact(kind="telegram", value=f"@{link.group('name')}")

    if TELEGRAM_RE.match(value):
        return Contact(kind="telegram", value=value)

    raise InvalidContactError("Use phone number, email or telegram (@username)")
