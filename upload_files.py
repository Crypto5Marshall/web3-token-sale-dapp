import ftplib

# FTP credentials
FTP_HOST = 'ftp.marshallinfotechs.com'
FTP_USER = 'u115017400.presalem'
FTP_PASS = 'K5^fEeAzX2V>PP:!'

def create_directory(ftp, dir_name):
    try:
        ftp.mkd(dir_name)
        print(f"Created directory: {dir_name}")
    except:
        print(f"Directory {dir_name} already exists or cannot be created")

try:
    # Connect to FTP server
    ftp = ftplib.FTP(FTP_HOST)
    ftp.login(FTP_USER, FTP_PASS)
    print("Connected to FTP server")

    # Create presalesm directory
    create_directory(ftp, 'presalesm')
    ftp.cwd('presalesm')
    print("Changed to presalesm directory")

    # Upload HTML files
    html_files = ['claim.html', 'index.html', 'buy.html']
    for file in html_files:
        print(f"\nUploading {file}...")
        with open(f'marshall-infotechs/{file}', 'rb') as f:
            ftp.storbinary(f'STOR {file}', f)
        print(f"{file} uploaded successfully")

    # Create and upload to js directory
    create_directory(ftp, 'js')
    ftp.cwd('js')
    print("Changed to js directory")

    print("\nUploading web3.js...")
    with open('marshall-infotechs/js/web3.js', 'rb') as f:
        ftp.storbinary('STOR web3.js', f)
    print("web3.js uploaded successfully")

    print("\nAll files uploaded successfully")
    ftp.quit()

except Exception as e:
    print(f"Error: {str(e)}")
