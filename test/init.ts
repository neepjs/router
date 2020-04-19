import * as Neep from '@neep/core';
import render from '@neep/web-render';
import * as monitorable from 'monitorable';
import * as NeepDevtools from '@neep/devtools';
import NeepRouter from '@neep/router';
Neep.install({ render, monitorable });
NeepRouter.install(Neep);
NeepDevtools.install(Neep);
