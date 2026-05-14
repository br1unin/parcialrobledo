## Why

The platform needs a product catalog with ingredient management. Customers need to browse products, filter by category or allergens, and view full ingredient details to make informed purchase decisions. Stock managers need full CRUD over products and ingredients.

## What Changes

- New `ingredientes` module: CRUD for ingredients with allergen flag (US-011 to US-014)
- Complete `productos` module: CRUD, public catalog with pagination/filtering, stock management, M2M category and ingredient associations (US-015 to US-023)

## Capabilities

### New Capabilities
- `ingredient-management`: Full CRUD for ingredients with allergen flag; used by stock managers and product associations
- `product-catalog`: Product CRUD, public catalog endpoint with pagination/search/filters, stock management, category and ingredient associations

### Modified Capabilities
<!-- None -->

## Out of Scope

- Image upload (imagen_url is a plain URL string)
- Carrito / frontend cart integration (us-004)
- Admin dashboard metrics (us-007)
