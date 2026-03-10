/**
 * Gera nomes aleatórios para workspaces
 * Combina adjetivos e substantivos para criar nomes únicos
 */

const adjectives = [
  'happy', 'brave', 'calm', 'eager', 'fancy', 'gentle', 'jolly', 'kind',
  'lively', 'merry', 'proud', 'quiet', 'silly', 'witty', 'zealous', 'bright',
  'clever', 'daring', 'elegant', 'fierce', 'graceful', 'heroic', 'intrepid',
  'jubilant', 'keen', 'loyal', 'majestic', 'noble', 'optimistic', 'peaceful',
  'radiant', 'serene', 'triumphant', 'upbeat', 'vibrant', 'warm', 'youthful',
  'azure', 'crimson', 'golden', 'silver', 'emerald', 'violet', 'scarlet',
  'amber', 'coral', 'ivory', 'jade', 'ruby', 'sapphire', 'topaz'
];

const nouns = [
  'panda', 'tiger', 'eagle', 'dolphin', 'falcon', 'wolf', 'bear', 'lion',
  'fox', 'hawk', 'owl', 'shark', 'whale', 'dragon', 'phoenix', 'cobra',
  'panther', 'jaguar', 'leopard', 'cheetah', 'gorilla', 'elephant', 'rhino',
  'hippo', 'crocodile', 'alligator', 'turtle', 'rabbit', 'squirrel', 'beaver',
  'otter', 'seal', 'penguin', 'flamingo', 'pelican', 'hummingbird', 'parrot',
  'cosmos', 'nebula', 'comet', 'meteor', 'planet', 'star', 'galaxy', 'quasar'
];

const separators = ['-', '_', ''];

/**
 * Gera um nome aleatório no formato: adjetivo-separador-substantivo
 * Ex: happy-panda, brave_tiger, calmdolphin
 * 
 * @param {Object} options - Opções de geração
 * @param {boolean} options.useSeparator - Usar separador entre palavras (padrão: true)
 * @param {string} options.separator - Caractere separador: '-', '_' (padrão: aleatório)
 * @param {boolean} options.includeNumber - Incluir número no final (padrão: false)
 * @returns {string} Nome aleatório gerado
 */
export function generateRandomName(options = {}) {
  const {
    useSeparator = true,
    separator = null,
    includeNumber = false
  } = options;

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  let sep = separator;
  if (useSeparator && !sep) {
    sep = separators[Math.floor(Math.random() * separators.length)];
  }
  
  let name = useSeparator ? `${adjective}${sep}${noun}` : `${adjective}${noun}`;
  
  if (includeNumber) {
    const num = Math.floor(Math.random() * 100);
    name = `${name}${num}`;
  }
  
  return name;
}

/**
 * Gera múltiplos nomes aleatórios únicos
 * 
 * @param {number} count - Quantidade de nomes a gerar
 * @param {Object} options - Opções de geração
 * @returns {string[]} Array de nomes aleatórios únicos
 */
export function generateRandomNames(count, options = {}) {
  const names = new Set();
  
  while (names.size < count) {
    names.add(generateRandomName(options));
  }
  
  return Array.from(names);
}

/**
 * Verifica se um nome é válido para workspace
 * (não contém caracteres especiais problemáticos)
 * 
 * @param {string} name - Nome a verificar
 * @returns {boolean} True se o nome é válido
 */
export function isValidWorkspaceName(name) {
  if (!name || typeof name !== 'string') return false;
  
  // Permite apenas letras, números, hífen e underscore
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(name);
}
