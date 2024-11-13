import { useState } from 'react';

export const useLazyLoad = (initial: number = 15, total: number) => {
  const [amount, setAmount] = useState(initial);

  const onBecomeVisible = (i: number) => {
    //originally I was loading "next 5" when you could see "last 5" but this "exponential loading" feels better
    const max = Math.floor(i * 2);
    if (amount < total && max > amount) setAmount(Math.floor(i * 2));
  };

  return [amount, onBecomeVisible];
};
