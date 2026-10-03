This repository currently stores resources for my main blog website, I utilized [hugo](https://gohugo.io/) the static site generator and [blowfish](https://blowfish.page/) the theme in practice.

After cloning the repo. First, grab the submodule for theming:

`git submodule update --init --depth 1 --progress`

Then, use [hugo](https://gohugo.io/) to create a new page.

For example, a post:

`hugo new posts/<year>/new-content.md`

