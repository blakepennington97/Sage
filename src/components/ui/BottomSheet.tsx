import React, { useMemo, forwardRef } from 'react';
import BottomSheet, { BottomSheetView, BottomSheetScrollView, BottomSheetProps } from '@gorhom/bottom-sheet';
import { createBox, createText } from '@shopify/restyle';
import { Theme } from '../../constants/restyleTheme';

// Create components directly to avoid circular imports
const Box = createBox<Theme>();
const Text = createText<Theme>();

interface CustomBottomSheetProps extends Partial<BottomSheetProps> {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: string[];
  scrollable?: boolean;
}

export const CustomBottomSheet = forwardRef<BottomSheet, CustomBottomSheetProps>(
  ({ isVisible, onClose, children, title, snapPoints = ['90%', '95%'], scrollable = false, ...props }, ref) => {
    const snapPointsMemo = useMemo(() => snapPoints, [snapPoints]);

    if (!isVisible) {
      return null;
    }

    const ContentWrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

    return (
      <BottomSheet
        ref={ref}
        index={1}
        snapPoints={snapPointsMemo}
        onClose={onClose}
        enablePanDownToClose
        backgroundStyle={{
          backgroundColor: '#1E1E1E', // surface color
        }}
        handleIndicatorStyle={{
          backgroundColor: '#666666',
        }}
        {...props}
      >
        <ContentWrapper style={{ flex: 1 }}>
          {title && (
            <Box 
              backgroundColor="surface" 
              paddingHorizontal="lg" 
              paddingVertical="md"
              borderBottomWidth={1}
              borderBottomColor="border"
            >
              <Text variant="h3" color="primaryText" textAlign="center">
                {title}
              </Text>
            </Box>
          )}
          {children}
        </ContentWrapper>
      </BottomSheet>
    );
  }
);