# GitHub Copilot Instructions for Sam2023website

## Project Overview

This is a personal portfolio website built with React 18.2.0 and TypeScript. The site uses Create React App as its build tool and React Bootstrap for UI components.

## Repository Structure

```
/
├── app/                    # Main React application
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── styles/        # SCSS stylesheets
│   │   ├── interfaces/    # TypeScript interfaces
│   │   ├── App.tsx        # Main app component
│   │   └── routes.tsx     # Route definitions
│   ├── public/            # Static assets
│   ├── package.json       # Dependencies and scripts
│   └── tsconfig.json      # TypeScript configuration
└── src/
    └── app.js             # Additional app logic
```

## Technology Stack

- **Frontend Framework**: React 18.2.0
- **Language**: TypeScript 4.9.5
- **UI Library**: React Bootstrap 2.9.2
- **Routing**: React Router DOM 6.21.1
- **Styling**: SCSS with Bootstrap 5.3.2
- **Build Tool**: react-scripts 5.0.1 (Create React App)
- **Testing**: Jest with React Testing Library

## Development Workflow

### Setting Up the Development Environment

1. Navigate to the app directory: `cd app`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
   - Opens at http://localhost:3000
   - Hot reloading enabled

### Building and Testing

- **Build for production**: `cd app && npm run build`
  - Output goes to `app/build/` directory
  - Optimized and minified
- **Run tests**: `cd app && npm test`
  - Interactive test runner
  - Uses Jest and React Testing Library
- **Lint**: Configured via ESLint (extends react-app)

## Coding Conventions

### TypeScript

- Use TypeScript for all new components
- Define interfaces in `app/src/interfaces/`
- Use React.FC for functional components
- Enable strict mode (already configured in tsconfig.json)

### React Components

- Use functional components with hooks
- Place reusable components in `app/src/components/`
- Place page components in `app/src/pages/`
- Follow the existing component structure pattern

### Styling

- Use SCSS for styling (files in `app/src/styles/`)
- Import Bootstrap components from `react-bootstrap`
- Follow Bootstrap naming conventions
- Keep styles modular and component-specific

### File Naming

- Components: PascalCase (e.g., `MyNav.tsx`, `Footer.tsx`)
- Styles: kebab-case with .scss extension (e.g., `app.scss`)
- Interfaces: PascalCase with descriptive names
- Tests: Component name with `.test.tsx` suffix

## Testing Guidelines

- Write tests for new components in the same directory as the component
- Use React Testing Library patterns
- Test user interactions and component rendering
- Use `@testing-library/jest-dom` matchers for assertions

## Common Tasks

### Adding a New Page

1. Create the page component in `app/src/pages/`
2. Add route configuration in `app/src/routes.tsx`
3. Update navigation in `app/src/components/MyNav.tsx` if needed

### Adding a New Component

1. Create the component file in `app/src/components/`
2. Define TypeScript interface for props in `app/src/interfaces/`
3. Create corresponding test file with `.test.tsx` suffix
4. Import and use in parent components

### Updating Styles

1. Modify or create SCSS files in `app/src/styles/`
2. Import styles in the relevant component
3. Use Bootstrap utilities where possible
4. Maintain responsive design principles

## Best Practices

1. **Always work in the `app/` directory** for React-related changes
2. **Run tests before committing** to ensure no regressions
3. **Keep components small and focused** on a single responsibility
4. **Use TypeScript types** to catch errors early
5. **Follow React Bootstrap patterns** for consistency
6. **Maintain accessibility** standards (semantic HTML, ARIA labels)
7. **Optimize performance**: Use React.memo for expensive components, lazy loading for routes
8. **Keep dependencies up to date** but test thoroughly after updates

## Deployment

The website is configured for deployment to AWS using:
- **Infrastructure**: AWS CloudFormation (configuration in `app/cloudformation.yaml`)
- **Hosting**: AWS S3 bucket with static website hosting
- **Deployment process**: 
  1. Build the production bundle: `cd app && npm run build`
  2. Deploy using CloudFormation stack with the S3 bucket configuration
  3. Upload the `app/build/` contents to the S3 bucket

## Important Notes

- The main application code is in the `app/` directory, not the root
- Use `npm` (not yarn) as the package manager
- The project uses React Router v6 syntax (element prop, not component)
- Bootstrap 5.3.2 is used, so ensure compatibility with Bootstrap 5 patterns
- Environment-specific configurations can be added via `.env` files (see .gitignore for patterns)
- Deployment infrastructure is defined in `app/cloudformation.yaml` for AWS S3 hosting

## Resources

- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [React Bootstrap Documentation](https://react-bootstrap.github.io/)
- [React Router Documentation](https://reactrouter.com/)
- [Create React App Documentation](https://create-react-app.dev/)
