# Releasing Code Bin

Built assets (`build/`) are never committed to `main`. Instead, each release is built by GitHub Actions and committed to its own `release-X.Y.Z` branch, which is tagged `X.Y.Z`. That tag is what Composer (via Packagist) installs and what is deployed to WordPress.org.

## 1. Prepare the release

On `main`:

1. Optionally, create a GitHub milestone named after the version, eg `1.2.0`, and assign the release's issues and PRs to it. The release fails if the milestone has any open issues or PRs.
2. Update the version number by running `bin/bump-version.sh` with either the new version or `major`, `minor` or `patch`:

   ```sh
   bin/bump-version.sh 1.2.0
   ```

   The script sets the version in `package.json` and `package-lock.json` with `npm version`, then copies it to:
   - the `Version:` header in `code-bin.php`
   - the `PLUGIN_VERSION` constant in `inc/namespace.php`
   - the `Stable tag:` header in `README.md`
   - the block's `version` in `src/code-bin-block/block.json`, which WordPress uses to cache bust the block's assets

   It doesn't commit or tag anything.
3. Add the release's entry to the `## Changelog` section of `README.md`.
4. Commit and push. The PHPUnit tests check that all the version numbers match.

## 2. Build the release

Push `main` to the `release` branch:

```sh
git push origin main:release
```

This runs the **Build** workflow (`.github/workflows/build.yml`), which:

1. reads the version from `package.json`
2. stops if the milestone for that version has open issues or PRs
3. runs `npm ci` and `npm run build`
4. commits the build to a new `release-X.Y.Z` branch
5. tags that commit `X.Y.Z`
6. creates a draft GitHub release for the tag
7. uploads a zip of the release as a workflow artifact

To test the build without tagging or creating a release, run the Build workflow manually from the Actions tab.

## 3. Publish the release

1. Open the draft release on GitHub and write the release notes.
2. Optionally, download the `build` artifact from the workflow run and test it.
3. Publish the release.

Publishing the release:

- **WordPress.org:** runs the **Deploy to WordPress.org Repository** workflow (`.github/workflows/wporg-deploy.yml`), which deploys the tag to the plugin directory and attaches the plugin zip to the GitHub release.
- **Packagist:** picks up the new tag as soon as the tag is pushed (in step 2), if the GitHub webhook is set up. Otherwise use the Update button on the package's Packagist page.

## Readme and asset updates

`README.md` is the only copy of the readme. Its front matter holds the WordPress.org readme headers (`Contributors`, `Tags`, `Stable tag`, etc). `npm run build` converts it to the WordPress.org format and saves it as `readme.txt`, which is not committed. To build just the readme, run `npm run build:readme`.

To change the readme or the WordPress.org assets (in `.wordpress-org/`) without making a release, push the change to `main`. The **Plugin asset/readme update** workflow (`.github/workflows/wporg-assets-update.yml`) deploys it to WordPress.org.

The workflow fails if any other files differ from the latest release on WordPress.org. Those changes need a full release.

## Fixing a failed release

The Build workflow can't overwrite an existing tag. To redo a release:

1. Delete the draft release, the `X.Y.Z` tag and the `release-X.Y.Z` branch on GitHub.
2. Fix the problem on `main`.
3. Push `main` to `release` again.

Never delete a tag after its release has been published, because Composer and WordPress.org users may already have installed it. Release a new version instead.

## Setup

- The WordPress.org workflows are disabled with `if: false` until the plugin is approved on WordPress.org. To enable them, remove those lines and add the `SVN_USERNAME` and `SVN_PASSWORD` secrets to the repository.
- The package is published on Packagist as `peterwilsoncc/code-bin`.
- The Node version used to build releases is set in `.nvmrc`.
