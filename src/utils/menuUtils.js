// src/utils/menuUtils.js 

/**
 * Filtra la lista de guarniciones para obtener solo las que están disponibles.
 * Nota: El Mixto siempre se incluye, su disponibilidad real se calcula en el componente.
 * @param {Array<Object>} guarniciones - Lista de guarniciones (con 'disponible' como booleano).
 * @returns {Array<Object>} Lista de guarniciones disponibles.
 */
export const getGuarnicionesDisponibles = (guarniciones) => {
    if (!Array.isArray(guarniciones) || guarniciones.length === 0) return [];

    // Incluimos solo las disponibles (true) o las que se llaman 'Mixto'.
    // Esto asegura que el botón 'Mixto' siempre aparezca, incluso si sus componentes están agotados.
    return guarniciones.filter(g => 
        g.disponible === true || g.nombre?.toLowerCase() === 'mixto'
    );
};

/**
 * Busca la opción de Guarnición Mixta en la lista.
 * @param {Array<Object>} guarniciones - Lista de guarniciones.
 * @returns {Object|null} El objeto de la guarnición mixta o null.
 */
export const getGuarnicionMixta = (guarniciones) => {
    if (!Array.isArray(guarniciones)) return null;
    return guarniciones.find(g => g.nombre?.toLowerCase() === 'mixto') || null;
};