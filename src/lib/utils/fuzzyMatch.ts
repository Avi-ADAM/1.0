// Utility functions for fuzzy string matching

/**
 * Fuzzy matching for individual words
 * @param word1 First word to compare
 * @param word2 Second word to compare
 * @returns true if words are similar enough
 */
export function fuzzyWordMatch(word1: string, word2: string): boolean {
  // Handle very short words
  if (word1.length < 2 || word2.length < 2) return false;
  
  // Calculate Levenshtein distance for similar length words
  if (Math.abs(word1.length - word2.length) <= 2) {
    const distance = levenshteinDistance(word1, word2);
    const maxLength = Math.max(word1.length, word2.length);
    // Allow 1-2 character differences for words of 4+ characters
    return distance <= Math.max(1, Math.floor(maxLength * 0.3));
  }
  
  // Check for common prefixes/suffixes
  if (word1.length >= 3 && word2.length >= 3) {
    // Check if one word starts with the other (for partial typing)
    if (word1.startsWith(word2.substring(0, 3)) || word2.startsWith(word1.substring(0, 3))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param str1 First string
 * @param str2 Second string
 * @returns Number of edits needed to transform str1 into str2
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Enhanced fuzzy matching for mission names with word-based matching
 * @param searchTerm The search query
 * @param targetText The text to search in
 * @param threshold Minimum percentage of words that must match (default: 0.5)
 * @returns Object with match status and score
 */
export function fuzzyMissionMatch(searchTerm: string, targetText: string, threshold: number = 0.5): { matches: boolean; score: number } {
  const searchLower = searchTerm.toLowerCase().trim();
  const targetLower = targetText.toLowerCase().trim();
  
  // Debug logging (can be removed in production)
  const debug = false; // Set to true for debugging
  if (debug) {
    console.log(`🔍 Fuzzy matching: "${searchTerm}" vs "${targetText}"`);
  }
  
  // Direct substring match (highest priority)
  if (targetLower.includes(searchLower)) {
    if (debug) console.log('✅ Direct substring match');
    return { matches: true, score: 1.0 };
  }
  
  // Reverse check - if search is longer, check if target is contained in search
  if (searchLower.includes(targetLower) && targetLower.length > 3) {
    if (debug) console.log('✅ Reverse substring match');
    return { matches: true, score: 0.9 };
  }
  
  // Split search term and target text into words
  const searchWords = searchLower.split(/\s+/).filter(word => word.length > 1);
  const targetWords = targetLower.split(/\s+/).filter(word => word.length > 1);
  
  if (debug) {
    console.log('Search words:', searchWords);
    console.log('Target words:', targetWords);
  }
  
  if (searchWords.length === 0) {
    return { matches: false, score: 0 };
  }
  
  // Check if search words are found in target text
  const matchedWords = searchWords.filter(searchWord => {
    const found = targetWords.some(targetWord => {
      const directMatch = targetWord.includes(searchWord) || searchWord.includes(targetWord);
      const fuzzyMatch = fuzzyWordMatch(searchWord, targetWord);
      const normalizedMatch = normalizeHebrewWord(searchWord) === normalizeHebrewWord(targetWord);
      
      if (debug && (directMatch || fuzzyMatch || normalizedMatch)) {
        console.log(`  ✅ "${searchWord}" matches "${targetWord}" (direct: ${directMatch}, fuzzy: ${fuzzyMatch}, normalized: ${normalizedMatch})`);
      }
      
      return directMatch || fuzzyMatch || normalizedMatch;
    });
    
    if (debug && !found) {
      console.log(`  ❌ "${searchWord}" - no match found`);
    }
    
    return found;
  });
  
  const score = matchedWords.length / searchWords.length;
  const matches = score >= threshold;
  
  if (debug) {
    console.log(`Score: ${score.toFixed(2)} (${matchedWords.length}/${searchWords.length}), Matches: ${matches} (threshold: ${threshold})`);
  }
  
  return { matches, score };
}

/**
 * Normalize Hebrew words to handle common variations
 * @param word Hebrew word to normalize
 * @returns Normalized word
 */
function normalizeHebrewWord(word: string): string {
  return word
    // Remove common Hebrew prefixes and suffixes that might vary
    .replace(/^(ה|ל|ב|מ|ש|ו|כ)/, '') // Remove common prefixes
    .replace(/(ים|ות|ה)$/, '') // Remove common suffixes
    // Handle final letters (sofit)
    .replace(/ך/g, 'כ')
    .replace(/ם/g, 'מ')
    .replace(/ן/g, 'נ')
    .replace(/ף/g, 'פ')
    .replace(/ץ/g, 'צ');
}

/**
 * Sort missions by relevance based on fuzzy matching
 * @param missions Array of missions to sort
 * @param searchTerm The search query
 * @returns Sorted array with most relevant missions first
 */
export function sortMissionsByRelevance<T extends { attributes: { name: string } }>(
  missions: T[], 
  searchTerm: string
): T[] {
  const searchLower = searchTerm.toLowerCase().trim();
  
  return missions.sort((a, b) => {
    const aName = a.attributes.name?.toLowerCase() || '';
    const bName = b.attributes.name?.toLowerCase() || '';
    
    // Calculate match scores
    const aMatch = fuzzyMissionMatch(searchLower, aName);
    const bMatch = fuzzyMissionMatch(searchLower, bName);
    
    // Sort by score (higher scores first)
    if (aMatch.score !== bMatch.score) {
      return bMatch.score - aMatch.score;
    }
    
    // If scores are equal, prefer exact substring matches
    const aExact = aName.includes(searchLower) ? 1 : 0;
    const bExact = bName.includes(searchLower) ? 1 : 0;
    
    return bExact - aExact;
  });
}