

export const dataUtils = {
 
  filterTestEntities: <T extends Record<string, any>>(
    entities: T[] | null | undefined
  ): T[] => {
    if (!Array.isArray(entities)) return [];
    
    return entities.filter(entity => {
      const mainIdentifier = String(
        entity.title || entity.campanyName || entity.companyName || 
        entity.name || entity.firstName || entity.subject || 
        entity.complainantName || ''
      ).toLowerCase().trim();

      const nameEn = String(entity.nameEn || '').toLowerCase().trim();
      const nameAr = String(entity.nameAr || '').toLowerCase().trim();
      const slug = String(entity.slug || '').toLowerCase().trim();
      
      const isTest = 
        mainIdentifier.includes('test') || mainIdentifier.includes('loai') || mainIdentifier === 'string' || mainIdentifier === 'user' || mainIdentifier.includes('123') ||
        nameEn.includes('test') || nameEn.includes('loai') || nameEn === 'string' ||
        nameAr.includes('test') || nameAr.includes('loai') || nameAr === 'string' ||
        slug.includes('test') || slug === 'string';
        
      // If none of the known text fields exist, we shouldn't drop it blindly. We just assume it's valid if we don't know how to filter it.
      const hasNoKnownFields = mainIdentifier === '' && nameEn === '' && nameAr === '' && slug === '';
      
      return !isTest && (hasNoKnownFields || mainIdentifier !== '' || nameEn !== '' || nameAr !== '' || slug !== '');
    });
  },

 
  unwrapList: <T>(response: any): T[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.items)) return response.items;
    if (Array.isArray(response.data)) return response.data;
    return [];
  },

  /**
   * Checks if a value is essentially empty or a placeholder 'string'.
   */
  isPlaceholder: (val?: string | null): boolean => {
    if (!val) return true;
    const v = val.toLowerCase().trim();
    return v === 'string' || v === 'undefined' || v === 'null' || v === '';
  }
};
