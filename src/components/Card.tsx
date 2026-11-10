import React from 'react';
import { ViewProps } from 'react-native';
import { AppCard, AppCardProps } from './AppCard';

export function Card(props: AppCardProps & ViewProps) {
  return <AppCard {...props} />;
}

