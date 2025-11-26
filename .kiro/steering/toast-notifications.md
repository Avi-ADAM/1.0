# Toast Notifications Best Practices

## Always Use Toast Instead of Alert

This project uses **svelte-sonner** for user notifications. Never use `alert()` or `window.alert()` - always use toast notifications instead.

## Import

```javascript
import { toast } from 'svelte-sonner';
```

## Usage Patterns

### Success Messages
```javascript
toast.success('Operation completed successfully');
toast.success('הפעולה הושלמה בהצלחה'); // Hebrew
toast.success('تمت العملية بنجاح'); // Arabic
```

### Error Messages
```javascript
toast.error('Something went wrong');
toast.error('משהו השתבש'); // Hebrew
toast.error('حدث خطأ ما'); // Arabic
```

### Info Messages
```javascript
toast.info('Please wait...');
toast.info('אנא המתן...'); // Hebrew
toast.info('يرجى الانتظار...'); // Arabic
```

### Warning Messages
```javascript
toast.warning('Are you sure?');
toast.warning('האם אתה בטוח?'); // Hebrew
toast.warning('هل أنت متأكد؟'); // Arabic
```

### Loading States
```javascript
// Show loading toast
const loadingToast = toast.loading('Processing...');

// Update to success
toast.success('Done!', { id: loadingToast });

// Or update to error
toast.error('Failed!', { id: loadingToast });
```

### Promise-based Operations
```javascript
toast.promise(
  fetchData(),
  {
    loading: 'Loading...',
    success: 'Data loaded!',
    error: 'Failed to load data'
  }
);
```

## Common Use Cases

### API Call Success
```javascript
const result = await actionClient.execute('createHaluka', params);
if (result.success) {
  toast.success('Haluka created successfully');
} else {
  toast.error(result.error?.message || 'Failed to create haluka');
}
```

### Form Validation
```javascript
if (!isValid) {
  toast.error('Please fill all required fields');
  return;
}
```

### Action Confirmation
```javascript
async function handleDelete() {
  const result = await deleteItem();
  if (result.success) {
    toast.success('Item deleted');
  } else {
    toast.error('Failed to delete item');
  }
}
```

### Network Errors
```javascript
try {
  await fetchData();
} catch (error) {
  toast.error('Network error. Please try again.');
}
```

## Multilingual Support

When showing messages, consider the current language:

```javascript
import { locale } from '$lib/translations';
import { get } from 'svelte/store';

const messages = {
  he: 'הפעולה הושלמה',
  en: 'Operation completed',
  ar: 'تمت العملية'
};

toast.success(messages[get(locale)] || messages.en);
```

Or use the translation function:

```javascript
import { t } from '$lib/translations';

toast.success($t('messages.success'));
```

## Toast Options

```javascript
toast.success('Message', {
  duration: 5000, // 5 seconds
  position: 'top-center',
  dismissible: true,
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo clicked')
  }
});
```

## Setup Required

Make sure the Toaster component is included in your root layout:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { Toaster } from 'svelte-sonner';
</script>

<Toaster position="top-center" />
```

## Migration from Alert

### Before (DON'T USE)
```javascript
alert('Operation completed');
window.alert('Error occurred');
```

### After (CORRECT)
```javascript
toast.success('Operation completed');
toast.error('Error occurred');
```

## Key Benefits

1. **Non-blocking**: Users can continue working while seeing the message
2. **Better UX**: More modern and less intrusive than alerts
3. **Customizable**: Can add actions, icons, and styling
4. **Multilingual**: Easy to integrate with translation system
5. **Accessible**: Better screen reader support
6. **Stackable**: Multiple toasts can be shown simultaneously
