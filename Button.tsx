import React, { forwardRef } from 'react';
import { LoadingButton } from '@mui/lab';
import { styled } from '@mui/material/styles';
import { classNames } from '../../lib/utils';
import type { ButtonProps as MuiButtonProps } from '@mui/material/Button';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon';

interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  iconOnly?: boolean;
}

// MUI X styled component with all variants
const StyledButton = styled(LoadingButton, {
  shouldForwardProp: (prop) => !['ownerState'].includes(prop.toString()),
})<{ ownerState: { variant: ButtonVariant; size: ButtonSize; iconOnly: boolean } }>(
  ({ theme, ownerState }) => ({
    // Base styles
    fontWeight: theme.typography.fontWeightMedium,
    borderRadius: theme.shape.borderRadius,
    transition: theme.transitions.create(['all'], {
      duration: theme.transitions.duration.short,
    }),
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
    },

    // Variant styles
    ...(ownerState.variant === 'primary' && {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      boxShadow: theme.shadows[2],
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        boxShadow: theme.shadows[4],
      },
    }),
    ...(ownerState.variant === 'secondary' && {
      backgroundColor: theme.palette.grey[100],
      color: theme.palette.text.primary,
      border: `1px solid ${theme.palette.grey[300]}`,
      '&:hover': {
        backgroundColor: theme.palette.grey[200],
      },
    }),
    ...(ownerState.variant === 'danger' && {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
      boxShadow: theme.shadows[2],
      '&:hover': {
        backgroundColor: theme.palette.error.dark,
        boxShadow: theme.shadows[4],
      },
    }),
    // Other variants (success, warning, ghost, outline) follow same pattern...

    // Size styles
    ...(ownerState.size === 'sm' && {
      padding: '6px 12px',
      fontSize: theme.typography.pxToRem(12),
      minHeight: 32,
    }),
    ...(ownerState.size === 'md' && {
      padding: '8px 16px',
      fontSize: theme.typography.pxToRem(14),
      minHeight: 36,
    }),
    // Other sizes follow same pattern...

    // Icon-only styles
    ...(ownerState.iconOnly && {
      aspectRatio: '1/1',
      padding: ownerState.size === 'sm' ? '6px' : 
               ownerState.size === 'md' ? '8px' : 
               ownerState.size === 'lg' ? '10px' : '12px',
    }),
  })
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      fullWidth = false,
      iconOnly = false,
      ...props
    },
    ref
  ) => {
    const ownerState = {
      variant,
      size,
      iconOnly,
    };

    return (
      <StyledButton
        ref={ref}
        className={classNames(className)}
        ownerState={ownerState}
        loading={loading}
        disabled={disabled}
        fullWidth={fullWidth}
        startIcon={!loading ? leftIcon : undefined}
        endIcon={!loading ? rightIcon : undefined}
        loadingPosition={leftIcon ? 'start' : rightIcon ? 'end' : 'center'}
        {...props}
      >
        {children}
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';