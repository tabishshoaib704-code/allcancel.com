"""Google Ads API client bootstrap."""
import os
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException


def load_client(config_path: str = "google-ads.yaml") -> GoogleAdsClient:
    """Load a GoogleAdsClient from a yaml credentials file.

    Raises FileNotFoundError with a clear message if the file is missing,
    since that's the most common first-run mistake.
    """
    if not os.path.exists(config_path):
        raise FileNotFoundError(
            f"Could not find '{config_path}'. Copy google-ads.yaml.example to "
            f"'{config_path}' and fill in your developer token and OAuth credentials."
        )
    return GoogleAdsClient.load_from_storage(config_path, version="v18")


def handle_googleads_exception(ex: GoogleAdsException):
    """Turn a GoogleAdsException into a readable summary string."""
    lines = [
        f"Request ID {ex.request_id} failed with status {ex.error.code().name}:"
    ]
    for error in ex.failure.errors:
        lines.append(f"  - {error.error_code}: {error.message}")
        if error.location:
            for field in error.location.field_path_elements:
                lines.append(f"      field: {field.field_name}")
    return "\n".join(lines)
