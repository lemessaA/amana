def normalize_imei(value: str) -> str:
    return value.strip().replace(" ", "").replace("-", "")


def validate_imei(value: str) -> bool:
    v = normalize_imei(value)
    if len(v) != 15 or not v.isdigit():
        return False
    # Luhn checksum
    total = 0
    for i, ch in enumerate(reversed(v)):
        d = int(ch)
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0
