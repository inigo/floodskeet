Scrape river level information from the Environment Agency website, and republish it on Bluesky.
See https://bsky.app/profile/oxfloodtweet.bsky.social.

This is an updated version of https://github.com/inigo/floodtweet.

## Setup

Create a .env file, with the following properties:

    BLUESKY_USERNAME=...
    BLUESKY_PASSWORD=...

The app is built with TypeScript. Use `npm run` to see build targets.

To change the rivers that are checked, change the station IDs in `src/FloodSkeet.ts.`

You can find ids via the website at http://www.environment-agency.gov.uk/homeandleisure/floods/riverlevels/.

If deploying to AWS via Terraform, you will need a `terraform.tfvars` file in the `terraform` directory:

    bluesky_username = "..."
    bluesky_password = "..."

And run `terraform apply` to deploy - assuming you already have appropriate AWS credentials
and have terraform already installed.

## License

Copyright (C) 2024 Inigo Surguy. Licensed under the GNU General Public License v3 - see LICENSE.txt for details.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

