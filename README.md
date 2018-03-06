# Admin UI Library for Enonic XP

[![Travis Build Status][travis-image]][travis-url]
[![License][license-image]][license-url]

UI framework, that provides [Enonic] (https://enonic.com) applications with core components and styles.

## Usage

Place the following dependency in your `build.gradle` file:

```gradle
dependencies {
    include 'com.enonic.lib:lib-admin-ui:1.2.0'
}
```

## Building

#### Default

Run the following command to build with default options:

```
./gradlew build
```

#### Environment

The project will be built in __production__ environment by default. 
But you can also set it explicitly by passing the `env` parameter with environment type:

```
./gradlew build -Penv=dev
```

There are only two options that are available now:
* `prod`
* `dev`

Both environments are almost identical, except that building in the development environment will result in creating the DTS files, sourcemaps and other things, critical for the debugging.
The build itself may also be a bit slower sometimes. 

#### Quick

Sometimes, you may want to build your project faster. To do so, just skip the linting (`lint` task) and testing (`test` task):

```
./gradlew build -x lint -x test
```

#### NPM upgrade

In case you want forcefully update all your node dependencies, use:

```
./gradlew npmInstallForce
```

Take a note, that you can also use aliases in Gradle, and `nIF` would be just enough to run `npmInstallForce`.


<!-- Links -->
[travis-url]:    https://travis-ci.org/enonic/lib-admin-ui
[travis-image]:  https://travis-ci.org/enonic/lib-admin-ui.svg?branch=master "Build status"
[license-url]:   LICENSE.txt
[license-image]: https://img.shields.io/github/license/enonic/lib-admin-ui.svg "GPL 3.0"
