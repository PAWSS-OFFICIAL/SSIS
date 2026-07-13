import sys
import os
sys.path.append('api')
from server import create_token

admin_user = {
    'id': 1,
    'username': 'admin',
    'email': 'admin@ssis.edu.in',
    'role': 'Admin',
    'name': 'System Admin',
    'idno': 'ADMIN1'
}

token = create_token(admin_user)
print(token)
