import urllib.request
import json
url = 'http://localhost/library-api/register.php'
data = json.dumps({
    'enrollmentId': 'testuser',
    'name': 'Test User',
    'email': 'test@example.com',
    'password': 'pass123'
}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    print(resp.status)
    print(resp.read().decode('utf-8'))
