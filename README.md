# FloofySite

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.6.

## License

The source code in this repository is licensed under the MIT License.

## Media and Images

All images and media files (e.g., files in `/assets/`) are **not covered by the MIT License**.

They are all rights reserved.  
You may view them as part of this repository or website, but you may not copy, reuse, modify, or distribute them without explicit permission.

## Backend (AWS Lambda)

The site's forms and reviews talk to Python AWS Lambdas in `aws_lambda/`: `floof-api` (reviews), `floof-comm`
(commissions), `floof-contact` and `floof-admin` (the moderation links in admin emails). They're deployed by hand as
zip uploads.

- **Set up and run the tests:** from `aws_lambda/`, run
  `uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python -r requirements-dev.txt` once, then
  `.venv/bin/pytest`.
- **Build an upload zip:** `./build.sh <lambda> <x86_64|arm64> <python-version>`, e.g.
  `./build.sh floof-api x86_64 3.14`. The zips land in `aws_lambda/dist/`.
- **Setup, deployment and environment variables:**
  [docs/features/review-moderation/aws-setup.md](docs/features/review-moderation/aws-setup.md).

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
