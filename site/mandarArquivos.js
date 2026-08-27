document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('bm36_token');
    const usuarioSalvo = localStorage.getItem('bm36_usuario');

    let usuario;

    try {
        usuario = JSON.parse(usuarioSalvo);
    } catch {
        usuario = null;
    }

    const ehAdmin = String(usuario?.perfil || '').toUpperCase() === 'ADMIN';

    if (!token || !ehAdmin) {
        window.location.replace('./inicio.html');
    }
});
