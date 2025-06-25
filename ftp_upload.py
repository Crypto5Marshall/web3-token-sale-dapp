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

    # Print current directory and contents
    print("\nCurrent directory:", ftp.pwd())
    print("\nDirectory contents:")
    ftp.retrlines('LIST')

    # Upload claim.html
    print("\nUploading claim.html...")
    with open('marshall-infotechs/claim.html', 'rb') as file:
        ftp.storbinary('STOR claim.html', file)
    
    print("Upload completed")
    ftp.quit()

except Exception as e:
    print(f"Error: {str(e)}")
