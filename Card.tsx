import React from 'react';
import { styled } from '@mui/material/styles';
import { classNames } from '../../lib/utils';
import { Paper, PaperProps } from '@mui/material';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardShadow = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends PaperProps {
  padding?: CardPadding;
  shadow?: CardShadow;
}

const paddingStyles = {
  none: { padding: 0 },
  sm: { padding: '16px' },
  md: { padding: '24px' },
  lg: { padding: '32px' },
};

const shadowStyles = {
  none: { boxShadow: 'none' },
  sm: { boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' },
  md: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
  lg: { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' },
};

const StyledCard = styled(Paper, {
  shouldForwardProp: (prop) => !['padding', 'shadow'].includes(prop.toString()),
})<CardProps>(({ theme, padding = 'md', shadow = 'md' }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  ...paddingStyles[padding],
  ...shadowStyles[shadow],
  transition: theme.transitions.create(['box-shadow', 'transform'], {
    duration: theme.transitions.duration.short,
  }),
}));

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  shadow = 'md',
  ...props
}) => {
  return (
    <StyledCard
      className={classNames(className)}
      padding={padding}
      shadow={shadow}
      {...props}
    >
      {children}
    </StyledCard>
  );
};