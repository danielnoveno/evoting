import base64

with open('diagram.mmd', 'r') as f:
    mermaid_code = f.read()

# mermaid.ink uses base64
b64_mermaid = base64.b64encode(mermaid_code.encode('utf-8')).decode('ascii')
url = f"https://mermaid.ink/img/{b64_mermaid}"
print(f"URL: {url}")
