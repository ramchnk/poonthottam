export const TEMPLATE_TYPES = {
    CLASSIC: 'classic',
    FLORAL_PREMIUM: 'floral-premium'
};

// Manually map tenantIds to their templates.
// If a tenant is not in this map, it defaults to CLASSIC.
export const TENANT_TEMPLATES = {
    'kasivetrivel': TEMPLATE_TYPES.FLORAL_PREMIUM, // Default tenant on localhost
    'mma': TEMPLATE_TYPES.FLORAL_PREMIUM,          // MMA Fresh Flowers
    // Add other tenants here manually in the future
};

export const getTemplateForTenant = (tenantId) => {
    return TENANT_TEMPLATES[tenantId] || TEMPLATE_TYPES.CLASSIC;
};
