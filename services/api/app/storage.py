import io
import os

BACKEND = os.getenv("STORAGE_BACKEND", "s3")  # s3 | local
LOCAL_DIR = os.getenv("LOCAL_STORAGE_DIR", "./data/bronze")

ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
ACCESS = os.getenv("MINIO_ROOT_USER", "minioadmin")
SECRET = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
BUCKET = os.getenv("MINIO_BUCKET", "bronze")
SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"


class _LocalS3:
    """Shim S3-API di atas folder lokal (MinIO resmi tak lagi tersedia publik).
    Aman path traversal: key dinormalisasi di bawah LOCAL_DIR/BUCKET."""

    def _path(self, key: str) -> str:
        safe = os.path.normpath(key).replace("\\", "/").lstrip("/")
        parts = [p for p in safe.split("/") if p not in ("", ".", "..")]
        return os.path.join(LOCAL_DIR, BUCKET, *parts)

    def head_bucket(self, Bucket=None):
        os.makedirs(os.path.join(LOCAL_DIR, BUCKET), exist_ok=True)

    def create_bucket(self, Bucket=None):
        os.makedirs(os.path.join(LOCAL_DIR, BUCKET), exist_ok=True)

    def put_object(self, Bucket=None, Key="", Body=b"", ContentType=""):
        dest = self._path(Key)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        data = Body.read() if hasattr(Body, "read") else Body
        with open(dest, "wb") as f:
            f.write(data if isinstance(data, bytes) else bytes(data))

    def get_object(self, Bucket=None, Key=""):
        with open(self._path(Key), "rb") as f:
            return {"Body": io.BytesIO(f.read())}


def client():
    if BACKEND == "local":
        return _LocalS3()
    import boto3
    from botocore.client import Config
    return boto3.client(
        "s3",
        endpoint_url=f"{'https' if SECURE else 'http'}://{ENDPOINT}",
        aws_access_key_id=ACCESS,
        aws_secret_access_key=SECRET,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )

def ensure_bucket():
    c = client()
    try:
        c.head_bucket(Bucket=BUCKET)
    except Exception:
        c.create_bucket(Bucket=BUCKET)

def get_bytes(object_key: str) -> bytes:
    c = client()
    obj = c.get_object(Bucket=BUCKET, Key=object_key)
    return obj["Body"].read()
