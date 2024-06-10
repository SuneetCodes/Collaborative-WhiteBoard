// src/services/keycloak.ts
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'http://localhost:8080/auth',
    realm: 'your-realm',
    clientId: 'your-client-id'
});

export default keycloak;
