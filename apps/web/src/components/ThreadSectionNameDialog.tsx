import { ThreadSectionName } from "@t3tools/contracts";
import * as Schema from "effect/Schema";
import { T, useGT } from "gt-react";
import { useEffect, useId, useState } from "react";
import { create } from "zustand";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Request = {
  readonly initialName: string;
  /** Names already in use; the current name of a rename is left out. */
  readonly taken: ReadonlyArray<string>;
  readonly resolve: (name: string | null) => void;
};
const useRequest = create<{ request: Request | null }>(() => ({ request: null }));
const isSectionName = Schema.is(ThreadSectionName);

/** Asks for a new or renamed sidebar section name; null when cancelled. */
export function requestThreadSectionName(options: {
  readonly initialName?: string;
  readonly taken: ReadonlyArray<string>;
}): Promise<string | null> {
  useRequest.getState().request?.resolve(null);
  return new Promise((resolve) =>
    useRequest.setState({
      request: { initialName: options.initialName ?? "", taken: options.taken, resolve },
    }),
  );
}

function finish(name: string | null) {
  const request = useRequest.getState().request;
  useRequest.setState({ request: null });
  request?.resolve(name);
}

export function ThreadSectionNameDialogHost() {
  const request = useRequest((state) => state.request);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- resolves a pending name request with null when the dialog host unmounts
  useEffect(() => () => finish(null), []);
  return request ? <ThreadSectionNameDialog request={request} /> : null;
}

function ThreadSectionNameDialog({ request }: { readonly request: Request }) {
  const gt = useGT();
  const id = useId();
  const [name, setName] = useState(request.initialName);
  const [error, setError] = useState<string | null>(null);
  const isRename = request.initialName !== "";
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) finish(null);
      }}
    >
      <DialogPopup className="sm:max-w-sm">
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = name.trim();
            if (!isSectionName(trimmed)) {
              setError(gt("Enter a name of up to 64 characters."));
              return;
            }
            if (request.taken.includes(trimmed)) {
              setError(gt("A section with this name already exists."));
              return;
            }
            finish(trimmed);
          }}
        >
          <DialogHeader>
            <DialogTitle>{isRename ? <T>Rename section</T> : <T>New section</T>}</DialogTitle>
          </DialogHeader>
          <DialogPanel>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-name`}>
                <T context="name of a sidebar section">Name</T>
              </Label>
              <Input
                id={`${id}-name`}
                autoFocus
                value={name}
                placeholder={gt("Awaiting deployment")}
                aria-invalid={error !== null}
                onChange={(event) => {
                  setName(event.target.value);
                  setError(null);
                }}
              />
              {error ? <p className="text-destructive-foreground text-xs">{error}</p> : null}
            </div>
          </DialogPanel>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => finish(null)}>
              <T>Cancel</T>
            </Button>
            <Button type="submit">{isRename ? <T>Rename</T> : <T>Create</T>}</Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
