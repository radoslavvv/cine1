import { Placeholder } from '../../../../shared/components/Placeholder/Placeholder';
import { LoadingLayout } from './LoadingLayout';
import { checkoutTheme as checkout } from '../Checkout/Checkout.theme';

export function ConfirmationSkeleton() {
  return (
    <LoadingLayout label="Loading your tickets…">
      <div className={checkout.panel}>
        <Placeholder className="mb-3 h-2.5 w-24" />
        <Placeholder className="h-9 w-5/6 sm:h-10" />
        <div className="mt-3 space-y-2">
          <Placeholder className="h-4 w-2/3" />
          <Placeholder className="h-4 w-1/2" />
          <Placeholder className="h-4 w-24" />
        </div>
        <div className={checkout.tickets}>
          {[0, 1].map((ticket) => (
            <div key={ticket} className={checkout.ticket}>
              <Placeholder className="mb-3 h-2.5 w-20" />
              <Placeholder className="mt-2 h-9 w-32" />
              <Placeholder className="mt-5 aspect-square w-49 max-w-full" />
            </div>
          ))}
        </div>
        <Placeholder className="h-4 w-3/4" />
        <div className={checkout.form}>
          <div className="grid gap-2">
            <Placeholder className="h-5 w-48 max-w-full" />
            <Placeholder className="h-12 w-full" />
          </div>
          <div className="space-y-2">
            <Placeholder className="h-3 w-full" />
            <Placeholder className="h-3 w-2/3" />
          </div>
          <div className={checkout.actions}>
            <Placeholder className="h-11 w-28" />
            <Placeholder className="h-12 w-28" />
          </div>
          <Placeholder className="h-3 w-3/4" />
        </div>
      </div>
    </LoadingLayout>
  );
}
