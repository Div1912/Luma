import zipfile
with zipfile.ZipFile('/home/div1912/.compact/versions/0.31.1/x86_64-unknown-linux-musl/artifact.zip', 'r') as z:
    z.extractall('/home/div1912/.compact/versions/0.31.1/x86_64-unknown-linux-musl/')
