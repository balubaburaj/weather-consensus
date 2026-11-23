# Project Rules & Guidelines - WeatherConsensus

## Git & Deployment Restrictions (CRITICAL)
- **NO AUTOMATIC GIT PUSH**: Never execute `git push` unless the user explicitly requests it (e.g., "push to git", "push to main", "deploy to prod").
- **Local Commits Allowed**: Staging and committing locally (`git commit`) for check-ins and version tracking is permitted when requested, but do NOT push to the remote repository.
- **Production CI/CD Safety**: Pushing to `origin main` immediately triggers the GitHub Actions workflow which deploys live to production (`weather.bwisetech.com`). Therefore, all pushes must be explicitly authorized by the user first.

## Design & UI Guidelines
- **Desktop Focus**: Focus layout and visual styling primarily on desktop view (1440x900 and 1280x800).
- **Consolidated Weather Hub**: Keep Current Temp, Feels Like, and Rain Status prominent with no duplicate metrics.
