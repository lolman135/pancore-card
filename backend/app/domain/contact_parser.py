import re

from app.domain.contact import Contact, InvalidContactError

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$")
PHONE_RE = re.compile(r"^\+?\d{10,15}$")
TELEGRAM_RE = re.compile(r"^@?[A-Za-z0-9_]{5,32}$")
TELEGRAM_LINK_RE = re.compile(
    r"^(?:https?://)?(?:t\.me|telegram\.me)/(?P<name>[A-Za-z0-9_]{5,32})/?$"
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
        return Contact(kind="telegram", value=f"@{value.lstrip('@')}")

    raise InvalidContactError("Use phone number, email or telegram (@username)")
