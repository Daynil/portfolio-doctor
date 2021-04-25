import { Dialog, Transition } from '@headlessui/react';
import React, { Fragment, useRef } from 'react';

type Props = {
  open: boolean;
  closeModal: () => void;
  title: string;
  body: React.ReactNode | string;
  description?: string;
  closeButtonText?: string;
};

export type DialogContentProps = Omit<Props, 'open' | 'closeModal'>;

export default function ModalDialog({
  open,
  closeModal,
  title,
  description,
  body,
  closeButtonText
}: Props) {
  const closeBtnRef = useRef();

  return (
    <Transition show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        initialFocus={closeBtnRef}
        static
        open={open}
        onClose={closeModal}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description>{description}</Dialog.Description>
              )}
              <div className="mt-2 mb-6">
                {typeof body === 'string' ? (
                  <p className="text-sm text-gray-500">{body}</p>
                ) : (
                  body
                )}
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-green-900 bg-green-200 border border-transparent rounded-md hover:bg-green-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
                  // ref={cancelButtonRef}
                  onClick={closeModal}
                >
                  {closeButtonText ? closeButtonText : 'Okay'}
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
