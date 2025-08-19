import axios from 'axios';
import L from 'leaflet';

window.axios = axios;
window.L = L;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
