import httpx
from tests.test_pipeline import create_synthetic_face_b64
from app.services.face_processor import decode_base64_image
import cv2

bgr = decode_base64_image(create_synthetic_face_b64())
_, buf = cv2.imencode('.jpg', bgr)

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
search_url = 'https://yandex.ru/images/search'
files = {'upfile': ('face.jpg', buf.tobytes(), 'image/jpeg')}
params = {'rpt': 'imageview', 'format': 'json', 'request': '{"blocks":[{"block":"b-page_type_search-by-image__link"}]}'}

res = httpx.post(search_url, params=params, files=files, headers=headers, timeout=10)
print('Yandex Status:', res.status_code)
if res.status_code == 200:
    try:
        data = res.json()
        print('Blocks:', data)
    except Exception as e:
        print('Parse error:', e)
