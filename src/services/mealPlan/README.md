# Meal Plan Single Source of Truth Architecture

This centralized architecture establishes a robust, consistent data flow for all meal plan operations in the Sage app.

## Architecture Overview

### 🏗️ **Core Components**

1. **MealPlanStore** - Main interface and single source of truth
2. **MealPlanDataLayer** - Database operations with validation/normalization  
3. **MealPlanMutationManager** - Optimistic updates and conflict resolution
4. **useMealPlanStore** - React hooks for component integration

### 📊 **Data Flow Pattern**

```
Component → useMealPlan Hook → MealPlanStore → MutationManager → DataLayer → Database
    ↑                                                                              ↓
    └─────────────── Optimistic Updates & Cache ←─────────────────────────────────┘
```

## Key Features

### ✅ **Single Source of Truth**
- All meal plan data flows through `MealPlanStore`
- Consistent data structure with `MealPlan` type
- Centralized cache management with TanStack Query

### ✅ **Optimistic Updates**
- Immediate UI updates for better UX
- Automatic rollback on errors
- Conflict resolution with version control

### ✅ **Data Integrity**
- Input validation and normalization
- Defensive JSON parsing
- Type-safe operations throughout

### ✅ **Performance Optimization**
- Mutation queuing prevents race conditions
- Smart caching with invalidation
- Batch operations for multiple updates

### ✅ **Error Handling**
- Graceful degradation on failures
- Conflict detection and resolution
- Comprehensive error types

## Usage Examples

### Basic Hook Usage
```typescript
const { mealPlan, actions, macroTotals, hasPendingChanges } = useMealPlan(weekStartDate);

// Update a meal slot
await actions.updateMealSlot({
  dayIndex: 0,
  mealType: 'breakfast',
  slot: { recipeId: '123', recipeName: 'Oatmeal' }
});

// Batch update multiple slots
await actions.batchUpdateMealSlots([
  { dayIndex: 0, mealType: 'lunch', slot: { recipeId: '456' } },
  { dayIndex: 1, mealType: 'lunch', slot: { recipeId: '456' } }
]);
```

### Direct Store Access
```typescript
const store = useMealPlanStore();

// Ensure meal plan exists
const mealPlan = await store.ensureMealPlan(userId, weekStartDate);

// Get macro calculations
const macros = store.getDayMacroTotals(userId, weekStartDate, 0);

// Check for pending changes
const hasChanges = store.hasPendingChanges(userId, weekStartDate);
```

## Migration Guide

### From Old useMealPlans Hook
```typescript
// OLD - Multiple state sources
const { data: mealPlan, mutate: updateMealPlan, refetch } = useMealPlans();
const [localState, setLocalState] = useState();

// NEW - Single source of truth
const { mealPlan, actions } = useMealPlan(weekStartDate);
```

### From Direct Service Calls
```typescript
// OLD - Direct service calls
import { mealPlanService } from '../services/mealPlanService';
await mealPlanService.updateMealPlan(planId, updates);

// NEW - Through store
const store = useMealPlanStore();
await store.updateMealSlot(planId, userId, weekStartDate, update);
```

## Benefits Over Previous Architecture

### 🔧 **Fixed Issues**
- ✅ No more race conditions between updates
- ✅ Consistent cache synchronization  
- ✅ Eliminated duplicate state management
- ✅ Proper optimistic updates for all operations
- ✅ Centralized error handling

### 🚀 **Performance Improvements** 
- ✅ Mutation queuing prevents conflicts
- ✅ Smart cache invalidation
- ✅ Reduced unnecessary refetches
- ✅ Better memory management

### 🛡️ **Reliability Enhancements**
- ✅ Version-based conflict detection
- ✅ Automatic rollback on failures  
- ✅ Data validation throughout pipeline
- ✅ Type safety from components to database

### 🎯 **Developer Experience**
- ✅ Simple, consistent API
- ✅ Comprehensive TypeScript support
- ✅ Built-in debugging tools
- ✅ Clear separation of concerns

## Architecture Patterns Used

### **Command Query Responsibility Segregation (CQRS)**
- Separate read and write operations
- Optimized queries vs mutations

### **Optimistic UI Pattern**
- Immediate UI updates
- Background synchronization
- Error rollback

### **Repository Pattern**
- DataLayer abstracts database operations
- Consistent interface for data access

### **Observer Pattern**
- Real-time subscription to data changes
- Automatic UI updates on state changes

This architecture provides a robust foundation for meal plan management that scales with the application's growth while maintaining data consistency and excellent user experience.