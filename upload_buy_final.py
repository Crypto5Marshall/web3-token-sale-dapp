import ftplib

# FTP credentials
FTP_HOST = 'ftp.marshallinfotechs.com'
FTP_USER = 'u115017400.presalem'
FTP_PASS = 'K5^fEeAzX2V>PP:!'

try:
    # Connect to FTP server
    ftp = ftplib.FTP(FTP_HOST)
    ftp.login(FTP_USER, FTP_PASS)
    print("Connected to FTP server")

    # Change to presalesm directory
    ftp.cwd('presalesm')
    print("Changed to presalesm directory")

    # Upload buy.html
    print("\nUploading buy.html...")
    with open('marshall-infotechs/buy.html', 'rb') as f:
        ftp.storbinary('STOR buy.html', f)
    print("buy.html uploaded successfully")

    ftp.quit()
    print("\nUpload completed")

except Exception as e:
    print(f"Error: {str(e)}")
