import type { ReactNode } from 'react';
import { bookingPageTheme as page } from '../BookingPage/BookingPage.theme';
import { seatMapTheme as seats } from '../SeatMap/SeatMap.theme';
import { checkoutTheme as checkout } from '../Checkout/Checkout.theme';

function Placeholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-sm bg-ivory/[0.06] motion-safe:animate-pulse ${className}`}
    />
  );
}

function LoadingLayout({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <p role="status" className="sr-only">
        {label}
      </p>
      <div aria-busy="true" aria-label={label}>
        <div aria-hidden="true">{children}</div>
      </div>
    </>
  );
}

export function BookingSkeleton() {
  return (
    <LoadingLayout label="Loading seats…">
      <div className={page.intro}>
        <Placeholder className="aspect-[2/3] w-full" />
        <div className={page.details}>
          <Placeholder className="mb-3 h-2.5 w-28" />
          <Placeholder className="h-9 w-3/4 max-w-96 sm:h-11" />
          <Placeholder className="mt-2 h-4 w-1/2 max-w-48" />
          <div className={page.metadata}>
            <Placeholder className="h-4 w-44" />
            <Placeholder className="h-4 w-20" />
            <Placeholder className="h-4 w-16" />
          </div>
        </div>
      </div>
      <div className={page.layout}>
        <div className={seats.panel}>
          <div className={seats.screen}>SCREEN</div>
          <div className="mb-4 flex justify-center sm:hidden">
            <Placeholder className="h-4 w-40" />
          </div>
          <div className="overflow-hidden pb-4">
            <div className="mx-auto grid w-max gap-y-1">
              {Array.from({ length: 8 }, (_, row) => (
                <div key={row} className="flex items-center">
                  <div className="flex w-7 justify-center">
                    <Placeholder className="h-3 w-2" />
                  </div>
                  {Array.from({ length: 12 }, (_, column) => (
                    <div key={column} className={seats.seat}>
                      <Placeholder className="h-8 w-8 rounded-t-lg" />
                    </div>
                  ))}
                  <div className="flex w-7 justify-center">
                    <Placeholder className="h-3 w-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={seats.legend}>
            {[0, 1, 2].map((item) => (
              <Placeholder key={item} className="h-5 w-20" />
            ))}
          </div>
        </div>
        <div className={page.summary}>
          <div className={page.summaryHeader}>
            <Placeholder className="my-2 h-7 w-28" />
            <Placeholder className="h-3 w-24" />
          </div>
          <div className={page.selectionDetails}>
            <Placeholder className="h-4 w-24" />
            <Placeholder className="mt-3 h-5 w-72 max-w-full" />
          </div>
          <div className={page.checkoutAction}>
            <Placeholder className="h-12 w-full sm:w-56" />
          </div>
        </div>
      </div>
    </LoadingLayout>
  );
}

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
