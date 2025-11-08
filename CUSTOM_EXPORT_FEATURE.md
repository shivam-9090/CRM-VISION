# Custom Export System - Feature Documentation

## Overview
A comprehensive date-range based export system that allows users to export deals in CSV format based on their creation date.

## Features Implemented

### 1. Frontend Export Modal (`frontend/src/components/deals/ExportModal.tsx`)

**Date Range Options:**
- ✅ **All Time**: Export all deals (no date filter)
- ✅ **Today**: Export deals created today
- ✅ **Last 7 Days**: Export deals from the last week
- ✅ **Last 30 Days**: Export deals from the last month
- ✅ **Custom Range**: User-selected start and end dates

**Validation:**
- Start date cannot be after end date
- Maximum date is today (cannot select future dates)
- Custom range requires both start and end dates

**User Experience:**
- Radio button selection for quick presets
- Date pickers for custom range
- Loading state during export
- Success/error toast notifications
- Dynamic filename: `deals_export_YYYY-MM-DD_to_YYYY-MM-DD.csv`

### 2. Frontend Integration (`frontend/src/app/deals/page.tsx`)

**Changes Made:**
- Line 14: Added `import ExportModal from '@/components/deals/ExportModal'`
- Line 127: State: `const [exportModalOpen, setExportModalOpen] = useState(false)`
- Line 687: Export button opens modal: `onClick={() => setExportModalOpen(true)}`
- Lines 1732-1735: Modal component rendered at end of page

**Removed:**
- Old `handleExportCSV` function (28 lines)
- Old `exportLoading` state (replaced with `exportModalOpen`)

### 3. Backend API Endpoint (`backend/src/export/export.controller.ts`)

**Endpoint:** `GET /api/export/deals`

**Query Parameters:**
- `startDate` (optional): ISO date string (YYYY-MM-DD)
- `endDate` (optional): ISO date string (YYYY-MM-DD)

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename=deals_export_${dateRange}.csv`
- Body: CSV file with deal data

**Security:**
- Requires permissions: `PERMISSIONS.DATA_EXPORT` and `PERMISSIONS.DEAL_EXPORT`
- Company-scoped: Only exports deals from user's company

### 4. Backend Service Logic (`backend/src/export/export.service.ts`)

**Date Filtering:**
- If `startDate` provided: `createdAt >= startDate (00:00:00)`
- If `endDate` provided: `createdAt <= endDate (23:59:59.999)`
- No dates: Export all deals

**CSV Fields:**
- ID, Title, Value, Stage, Priority
- Expected Close Date, Closed At
- Contact Name, Contact Email
- Company Name
- Created At, Updated At

## Usage Flow

1. User navigates to Deals page
2. Clicks "Export CSV" button (top right)
3. Export modal opens with 5 options
4. User selects date range option:
   - **Quick select**: All Time, Today, Last 7 Days, or Last 30 Days
   - **Custom**: Picks start and end dates
5. User clicks "Export CSV" button in modal
6. Frontend calculates exact date range
7. API call: `GET /api/export/deals?startDate=X&endDate=Y`
8. Backend filters deals by `createdAt` date
9. CSV file auto-downloads with descriptive filename
10. Success toast notification appears
11. Modal closes automatically

## Technical Details

### Date Calculations (Frontend)
```typescript
// Today
startDate = new Date().toISOString().split('T')[0]

// Last 7 Days
const date = new Date();
date.setDate(date.getDate() - 7);
startDate = date.toISOString().split('T')[0]

// Last 30 Days
const date = new Date();
date.setDate(date.getDate() - 30);
startDate = date.toISOString().split('T')[0]
```

### Date Filtering (Backend)
```typescript
whereClause.createdAt = {
  gte: new Date(startDate),  // Start of day
  lte: new Date(endDate + ' 23:59:59.999')  // End of day
}
```

### File Download (Frontend)
```typescript
const blob = new Blob([response.data], { type: 'text/csv' });
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = filename;
link.click();
```

## Testing Checklist

- [ ] **All Time**: Exports all 166 deals
- [ ] **Today**: Exports only deals created today
- [ ] **Last 7 Days**: Exports deals from last week
- [ ] **Last 30 Days**: Exports deals from last month
- [ ] **Custom Range**: 
  - [ ] Valid range works correctly
  - [ ] Start > End shows error
  - [ ] Future dates are disabled
  - [ ] Empty dates show validation message
- [ ] CSV file downloads successfully
- [ ] Filename matches selected date range
- [ ] CSV contains correct deal data
- [ ] Only user's company deals are exported (multi-tenancy)
- [ ] Loading state shows during export
- [ ] Success toast appears after download
- [ ] Error handling for API failures
- [ ] Modal closes after successful export

## Files Modified

### Frontend (2 files modified, 1 created)
1. ✅ `frontend/src/app/deals/page.tsx` - Integration
2. ✅ `frontend/src/components/deals/ExportModal.tsx` - NEW (265 lines)

### Backend (2 files modified)
1. ✅ `backend/src/export/export.controller.ts` - Added date params
2. ✅ `backend/src/export/export.service.ts` - Added date filtering

## Dependencies
- Frontend: axios (API calls), lucide-react (icons), sonner (toasts)
- Backend: json2csv (CSV generation), Prisma (database queries)

## Permissions Required
- `PERMISSIONS.DATA_EXPORT`
- `PERMISSIONS.DEAL_EXPORT`

## Notes
- Export is always company-scoped (multi-tenant safe)
- Dates are filtered based on `createdAt` field
- End date includes the entire day (23:59:59.999)
- Custom date range requires both start and end dates
- Maximum selectable date is today
- CSV encoding: UTF-8
- File size: Depends on number of deals in range

## Future Enhancements (Optional)
- [ ] Add contact and company fields as optional columns
- [ ] Export other entities (contacts, activities, companies)
- [ ] Schedule recurring exports
- [ ] Email export results
- [ ] Export to Excel format
- [ ] Include deal activities in export
- [ ] Export filter results (not just all deals)
- [ ] Export preview before download
- [ ] Save custom export templates
