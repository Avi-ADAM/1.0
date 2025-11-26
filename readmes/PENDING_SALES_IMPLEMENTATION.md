# Pending Sales Implementation - Complete

## Overview
Updated the haluka (division) system to use a `pending` flag for sales during the voting phase, and only mark them as `splited` when voting is complete.

## Changes Made

### 1. GraphQL Mutations Updated (`src/routes/api/send/qids.js`)

#### `71updateSaleSplited` - Now supports `pending` parameter
```graphql
mutation UpdateSaleSplited($id: ID!, $splited: Boolean, $pending: Boolean, $tosplits: [ID])
```
- Added `pending` parameter to track sales in voting phase
- Returns both `splited` and `pending` status

#### `80updateSale` - Clears pending when marking as splited
```graphql
mutation UpdateSale($saleId: ID!) {
  updateSale(
    id: $saleId
    data: { 
      splited: true,
      pending: false  # Clear pending flag
    }
  )
}
```

### 2. Sale Creation Flow (`src/lib/components/prPr/whowhat.svelte`)

#### When creating a new tosplit (division proposal):
```javascript
// Mark sales as pending (not splited yet)
for (let saleId of salesIds) {
  await sendToSer(
    {
      id: saleId,
      pending: true,  // ✅ NEW: Mark as pending during voting
      tosplits: [tosplitId]
    },
    '71updateSaleSplited',
    null,
    null,
    false,
    fetch
  );
}
```

#### When updating an existing tosplit:
```javascript
// Update each sale to mark as pending (not splited yet, waiting for votes)
for (let saleId of salesIds) {
  await sendToSer(
    {
      id: saleId,
      pending: true,  // ✅ NEW: Keep as pending during updates
      tosplits: [currentTosplit.id]
    },
    '71updateSaleSplited',
    null,
    null,
    false,
    fetch
  );
}
```

#### Filtering logic updated:
```javascript
// Filter: include pending sales in calculations (exclude only fully splited)
// This ensures pending sales appear in the division table
unsplitedSales = salee.filter(sale => 
  !sale.attributes.splited &&  // Include pending sales!
  (!sale.attributes.tosplits?.data || sale.attributes.tosplits.data.length === 0)
);

// Calculations include ALL non-splited sales (including pending)
// This shows pending sales in the table so users can see what's being voted on
const unsplitedOnly = salee.filter(s => !s.attributes.splited);
```

### 3. Approval Flow (`src/routes/api/approveHaluka/+server.ts`)

When all users approve the haluka:
```typescript
// Step 2: Update all sales as splited (and clear pending flag)
// This marks the sales as fully processed after all votes are in
for (const sale of salesData) {
  await sendToSer(
    { saleId: sale.id },
    '80updateSale',  // Sets splited=true, pending=false
    0,
    0,
    false,
    fetch
  );
}
```

### 4. UI Updates (`src/lib/components/prPr/hamatanot.svelte`)

#### Visual indicators for sale status:
```svelte
<div class="relative button-whitegold py-2 px-5 m-2 rounded shadow-2xl shadow-fuchsia-400 
  {data.attributes.splited ? 'opacity-50 border-2 border-green-500' : 
   data.attributes.pending ? 'opacity-75 border-2 border-blue-500' : ''}">
  
  {#if data.attributes.splited}
    <div class="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
      ✓ {$lang === 'he' ? 'חולק' : 'Split'}
    </div>
  {:else if data.attributes.pending}
    <div class="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
      ⏳ {$lang === 'he' ? 'בהצבעה' : 'Pending'}
    </div>
  {/if}
</div>
```

#### Summary display with separate pending count:
```svelte
{#if salee.some(s => s.attributes.splited || s.attributes.pending)}
  <div class="border-t border-barbi/30 pt-2">
    <h2 class="text-sm font-medium">
      {$lang === 'he' ? 'ממתין לחלוקה:' : 'Awaiting Split:'}
    </h2>
    <p class="font-bold text-lg">{allin}</p>
  </div>
  
  {#if salee.some(s => s.attributes.pending)}
    <div class="border-t border-barbi/30 pt-2 mt-2">
      <h2 class="text-sm font-medium text-blue-600">
        {$lang === 'he' ? 'בהצבעה:' : 'In Voting:'}
      </h2>
      <p class="font-bold text-lg text-blue-600">
        {salee.filter(s => s.attributes.pending).reduce((total, s) => total + s.attributes.in, 0)}
      </p>
    </div>
  {/if}
{/if}
```

#### Calculation updates:
```javascript
$effect(() => {
  // Count all sales
  totalSales = salee.reduce((total, s) => total + s.attributes.in, 0);
  
  // Count all unsplited sales (including pending) - these are awaiting split
  // This includes pending sales in the "awaiting split" total
  allin = salee
    .filter(s => !s.attributes.splited)
    .reduce((total, s) => total + s.attributes.in, 0);
});
```

## Sale Status Flow

```
┌─────────────────┐
│  New Sale       │
│  splited: false │
│  pending: false │
└────────┬────────┘
         │
         │ User creates tosplit
         ▼
┌─────────────────┐
│  In Voting      │
│  splited: false │
│  pending: true  │ ← ✅ NEW STATE
└────────┬────────┘
         │
         │ All users approve
         ▼
┌─────────────────┐
│  Completed      │
│  splited: true  │
│  pending: false │
└─────────────────┘
```

## Benefits

1. **Clear Status Tracking**: Sales now have 3 distinct states:
   - Available for splitting (`splited: false, pending: false`)
   - In voting process (`splited: false, pending: true`)
   - Fully processed (`splited: true, pending: false`)

2. **Prevents Double-Splitting**: Pending sales are marked and tracked, preventing confusion

3. **Better UX**: 
   - Pending sales **appear in the division table** so users can see what's being voted on
   - Visual badges clearly show status
   - Separate counter shows amount currently in voting

4. **Visual Feedback**: 
   - Green badge with checkmark for completed splits
   - Blue badge with hourglass for pending votes

5. **Accurate Change Detection**: 
   - Including pending sales in calculations prevents false "change detected" alerts
   - Users see the same data in the table as what's being voted on

## Database Schema Requirements

Ensure the `sale` content type in Strapi has:
- `splited` (Boolean, default: false)
- `pending` (Boolean, default: false)
- `tosplits` (Relation to tosplit)

## Testing Checklist

- [ ] Create a new tosplit - sales should be marked as `pending: true`
- [ ] Check hamatanot page - pending sales should show blue badge
- [ ] Verify pending sales are excluded from new division calculations
- [ ] Complete voting (all users approve) - sales should become `splited: true, pending: false`
- [ ] Check hamatanot page - completed sales should show green badge
- [ ] Verify completed sales don't appear in available amount
- [ ] Update an existing tosplit - sales should remain `pending: true`
- [ ] Check graphs - pending sales should not affect calculations

## Related Files

- `src/routes/api/send/qids.js` - GraphQL mutations
- `src/lib/components/prPr/whowhat.svelte` - Division calculation and creation
- `src/lib/components/prPr/hamatanot.svelte` - Sales display and filtering
- `src/routes/api/approveHaluka/+server.ts` - Approval endpoint
- `src/lib/components/lev/halukaask.svelte` - Voting UI (uses API endpoint)
