# Calendar holidays

Edit [`holidays.json`](./holidays.json) to change holiday names and emojis or add dates. Each entry has a `name`, an `emoji`, a `type`, and optional `kind` for its highlight color.

Supported date rules:

- `annual`: repeats every year. Add numeric `month` and `day`.
- `nth-weekday`: repeats on a weekday occurrence in a month. Add `month`, lowercase `weekday` (`sunday` through `saturday`), and `occurrence` (1-5).
- `weekday-on-or-before`: repeats on the named weekday on or before a date in that month. Add `month`, `day`, and lowercase `weekday`.
- `easter-offset`: repeats relative to Easter Sunday. Add `offsetDays` (for example, `-2` is Good Friday).
- `one-off`: appears on one date only. Add a `date` in `YYYY-MM-DD` format.

For a birthday that repeats every year, use `annual` with a `🎂` emoji. For a birthday in a specific year only, use `one-off`. Multiple entries may use the same date; all their emojis and names will be shown.

Optional `kind` values are `general`, `valentine`, `canada`, `christmas`, `halloween`, and `birthday`. If omitted, the standard holiday highlight is used.
