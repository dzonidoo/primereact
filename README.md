Superdesk fork of PrimeReact 5.0.2

## Versioning

Original version is used with a patch version after the dash e.g. 5.0.2-2

## Publishing to npm

* Run `npm publish` to publish an update of the package.
* Do not forget to increment the version according to the rule above.
* Ensure that there are no unstaged changes before publishing. `prepublishOnly` script generates distribution files in the root directory of the project which are not ignored by git.

# Changes

### Dropdown
* Added zIndex prop
* Added ability to retrieve/filter items asynchronously

### MultiSelect
* Added zIndex prop

### Dialog
* Replaced `baseZIndex` with `zIndex`. The former was adding `1000` to specified base index which interferes with base superdesk styles that generally use lower z-indexes. `zIndex` makes it possible to pass a pre-determined value that is not changed.


### Dependencies
* Moved "react-transition-group" from "devDependencies" to "dependencies" section in `package.json`, because it is used in exported components.