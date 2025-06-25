import ftplib
import os

def upload_file(ftp, local_path, remote_path):
    with open(local_path, 'rb') as file:
        ftp.storbinary(f'STOR {remote_path}', file)

# FTP credentials
FTP_HOST = 'ftp.marshallinfotechs.com'
FTP_USER = 'u115017400.presalem'
FTP_PASS = 'K5^fEeAzX2V>PP:!'
REMOTE_PATH = '/home/u115017400/domains/marshallinfotechs.com/public_html/presalesm'

try:
    # Connect to FTP server
    ftp = ftplib.FTP(FTP_HOST)
    ftp.login(FTP_USER, FTP_PASS)
    print("Connected to FTP server")

    # Change to remote directory
    ftp.cwd(REMOTE_PATH)
    print(f"Changed to directory: {REMOTE_PATH}")

    # Upload HTML files
    files_to_upload = [
        ('marshall-infotechs/claim.html', 'claim.html'),
        ('marshall-infotechs/index.html', 'index.html'),
        ('marshall-infotechs/buy.html', 'buy.html'),
    ]

    for local_file, remote_file in files_to_upload:
        print(f"Uploading {local_file} to {remote_file}")
        upload_file(ftp, local_file, remote_file)

    # Create and upload to js directory
    try:
        ftp.mkd('js')
    except:
        pass
    ftp.cwd('js')
    
    print("Uploading web3.js")
    upload_file(ftp, 'marshall-infotechs/js/web3.js', 'web3.js')

    ftp.quit()
    print("All files uploaded successfully")

except Exception as e:
    print(f"Error: {str(e)}")
