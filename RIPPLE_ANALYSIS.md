# Ripple Layout Analysis

## Problem Summary

The layout algorithm is not properly spacing level 2 nodes because it only considers `derivesFrom` edges for depth calculation and parent mapping, but the ripple subgraph includes other edge types (`uses`, `filtersBy`, `sortsBy`) that represent valid dependency relationships.

## Root Cause

1. **`computeDerivationDepths`** (layout.ts:559) - Only processes `derivesFrom` edges
2. **`buildImmediateParentMap`** (layout.ts:622) - Only processes `derivesFrom` edges  
3. **`buildFieldRipple`** (fieldRipple.ts:20-26) - Includes multiple edge types:
   - `derivesFrom` (equations, sums, concatenations)
   - `filtersBy` (view filters)
   - `sortsBy` (sort operations)
   - `uses` (used in rules/criteria/values)

## Impact

When views reference fields via `uses`/`filtersBy`/`sortsBy` edges:
- Views don't get proper depth assignments (all end up at depth 0)
- Fields don't have views as parents in the parent map
- All nodes get bunched together at the same level
- Level 2 nodes (views, tasks, etc. that reference fields) are not positioned relative to their parent fields

## Expected Behavior

Based on user expectation:
```
object -> fields -> field references (views, tasks, pages, etc.)
```

The layout should:
1. Position fields relative to their parent object
2. Position views/tasks/etc. relative to the fields they reference
3. Maintain proper spacing so nodes from different parents don't bunch together

## Proposed Solution

The issue is that `positionViewsInBands` positions views relative to fields, but when multiple views reference the same field(s), they all get the same average position and bunch together. We need to apply the same grouping logic used for fields to views.

### Current Architecture

1. **Fields** are positioned in `positionFieldsByLayerAlignedToParents`
   - Groups fields by parent
   - Spaces groups appropriately
   - ✅ This is working correctly

2. **Views** are positioned in `positionViewsInBands`
   - Finds views with `filtersBy` or `sortsBy` edges to fields
   - Positions each view at the average position of its target fields
   - ❌ Multiple views referencing the same field get the same position (bunching)

### Implementation Strategy

1. **Extend `positionViewsInBands` to include `uses` edges**
   - Currently only considers `filtersBy` and `sortsBy` (line 1000)
   - Should also consider `uses` edges which represent view->field dependencies

2. **Apply grouping logic to views similar to fields**
   - Group views by their target field(s)
   - Views referencing the same field(s) should be grouped together
   - Space groups appropriately to prevent bunching
   - Position views within each group relative to their parent field(s)

3. **Alternative: Extend depth/parent system to include views**
   - Include `uses`, `filtersBy`, `sortsBy` edges in depth calculation
   - Include views in parent mapping
   - Process views in `positionFieldsByLayerAlignedToParents` alongside fields
   - This would unify the positioning logic

## Testing

After implementing the fix, verify:
1. Views appear at depth 2 (one level after fields)
2. Views are positioned relative to the fields they reference
3. Multiple views referencing the same field are grouped together
4. Views referencing different fields are spaced appropriately

