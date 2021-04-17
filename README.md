# git-miner

[![Build Status](https://travis-ci.com/riccardomerlin/git-miner.svg?branch=master)](https://travis-ci.com/riccardomerlin/git-miner)

Mine git data to calculate complexity trends.
Inspired by [maat-scripts](https://github.com/adamtornhill/maat-scripts) [Adam Tornhill](https://github.com/adamtornhill)

## Get started
```bash
git clone https://github.com/riccardomerlin/git-miner.git

cd git-miner

npm intsall

npm install -g
```

If you want to calculate the complexity of
the entire repository, go to the git repo folder and run:
```
git-miner
```

or for an individual file
```bash
git-miner path/to/the/file
```

or for a subset of files
```bash
git-miner -- path/to/the/file1 path/to/the/file2 path/to/the/fileN
```

