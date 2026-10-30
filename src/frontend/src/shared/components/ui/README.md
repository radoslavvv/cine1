# UI controls

These components come from [shadcn/ui](https://ui.shadcn.com), using Radix primitives for interactive controls. Their source lives here so cinema styling can be maintained locally.

Use `Button` variants (`default`, `outline`, `destructive`, `ghost`, `link`), `Input`, `Textarea`, and `Checkbox` for ordinary controls. Buttons default to `type="button"`; form submissions must set `type="submit"` explicitly. `asChild` supports links without nesting interactive elements.

Use `NativeSelect` with `NativeSelectOption` in forms that need native required validation and fieldset behavior. Use `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, and `SelectItem` for the custom dropdown experience, with a label associated with the trigger. Radix Select items require nonempty values.

Colors come from the semantic tokens in `src/app/theme.css`, which map to the cinema palette. `cn` merges Tailwind overrides. The older `shared/components/Button` import delegates to this Button while preserving its public-page appearance.

`components.json` configures the registry and aliases. Add components from `src/frontend` with `npx shadcn@latest add <component>`; review generated imports and styles to match these conventions.
